import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Invoice, Libelle } from 'src/domain/entities';
import { companyType } from 'src/domain/enums/company.enums';
import { invoiceStatus, invoiceType } from 'src/domain/enums/invoice.enums';
import { AddInvoicePaymentDto, CreateInvoiceDto, UpdateInvoiceDto } from '../dtos';
import { InvoiceFactory } from '../factoryMapper';
import { buildInvoicePdfBuffer, InvoicePdfTotals, VatSummaryRow } from '../utils/invoice-pdf';
import { XmlGeneratorUseCases } from './xmlGenerator.useCase';
import { Types } from 'mongoose';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';
import { Role } from 'src/domain/enums/role.enums';

type RequestUser = {
  _id: string;
  roles?: string[];
};

@Injectable()
export class InvoiceUseCases {
  constructor(
    private dataService: IDataServices,
    private invoiceFactory: InvoiceFactory,
    private xmlGeneratorUseCases: XmlGeneratorUseCases
  ) { }

  async getAllInvoices(
    user: RequestUser,
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ invoices: Invoice[]; totalInvoices: number }> {
    const query: any = { deletedAt: null };
    const orQueries: any[] = [];
    let companyIdFilter: string | undefined;

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        if (['username', 'invoiceNumber', 'applicationName'].includes(key) && typeof value === 'string') {
          orQueries.push({
            [key]: { $regex: value, $options: 'i' }
          });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ username: searchRegex });
          orQueries.push({ invoiceNumber: searchRegex });
          orQueries.push({ applicationName: searchRegex });
        } else if ((key === 'companyId' || key === 'mycompanyId') && typeof value === 'string') {
          companyIdFilter = value;
          query.mycompanyId = new Types.ObjectId(value);
        } else if (key === 'clientType' && value) {
          query.clientType = value;
        } else if (key === 'invoiceStatus' && value) {
          query.invoiceStatus = value;
        } else if (key === 'invoiceType' && value) {
          query.invoiceType = value;
        } else if (key === 'dateFrom' && value) {
          query.dateInvoice = { ...query.dateInvoice, $gte: value };
        } else if (key === 'dateTo' && value) {
          query.dateInvoice = { ...query.dateInvoice, $lte: value };
        } else {
          query[key] = value;
        }
      }
    }

    if (!this.isAdmin(user.roles)) {
      if (!companyIdFilter) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, companyIdFilter, [CompanyRole.ACCOUNTANT]);
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const invoices = await this.dataService.invoice.findAllByAttributeWithFilter(finalQuery, page, limit, { createdAt: -1 });
    const totalInvoices = await this.dataService.invoice.count(finalQuery);

    return { invoices, totalInvoices };
  }

  async getInvoiceById(user: RequestUser, id: string): Promise<Invoice> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = invoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    return invoice;
  }

  /**
   * Get the last invoice number to generate the next one
   */
  private async getLastInvoiceNumber(): Promise<string | null> {
    const currentYear = new Date().getFullYear();

    // Find invoices from current year
    const invoices = await this.dataService.invoice.findAllByAttribute(
      'invoiceNumber',
      new RegExp(`^${currentYear}-`)
    );

    if (!invoices || invoices.length === 0) {
      return null;
    }

    // Sort by invoice number descending to get the latest
    const sortedInvoices = invoices.sort((a, b) => {
      const numA = parseInt(a.invoiceNumber.split('-')[1]);
      const numB = parseInt(b.invoiceNumber.split('-')[1]);
      return numB - numA;
    });

    return sortedInvoices[0].invoiceNumber;
  }

  /**
   * Convertit le montant selon le taux de change fourni
   */
  private convertMontantSelonDevis(montant: number, tauxChange: number): number {
    return montant * tauxChange;
  }



  /**
   * Calculate invoice totals without creating it
   */
  async calculateInvoice(user: RequestUser, invoiceData: CreateInvoiceDto): Promise<{
    totalHT: string;
    totalTTC: string;
    totalTax: string;
    totalDiscount: string;
    timbre?: string;
    retenue?: string;
    totalTTC_apres_retenue?: string;
    totalTTC_final?: string;
    montantInternational?: number;
  }> {
    if (!this.isAdmin(user.roles)) {
      if (!invoiceData.mycompanyId) {
        throw new ForbiddenException('mycompanyId is required.');
      }
      await this.assertCompanyMembership(user._id, invoiceData.mycompanyId, [CompanyRole.ACCOUNTANT]);
    }

    // Validate that libelles are provided
    if (!invoiceData.Libelle || invoiceData.Libelle.length === 0) {
      throw new BadRequestException('Invoice must have at least one libelle.');
    }
    // Get libelles to calculate totals
    const libelles: Libelle[] = [];
    for (const libelleId of invoiceData.Libelle) {
      const libelle = await this.dataService.libelle.get(libelleId);
      if (!libelle) {
        throw new NotFoundException(`Libelle with ID ${libelleId} not found.`);
      }
      libelles.push(libelle);
    }

    // Fetch additional tax settings objects if provided
    let additionalTaxSettingsObjects: any[] | undefined = undefined;
    if (invoiceData.AdditionalTaxSettings && invoiceData.AdditionalTaxSettings.length > 0) {
      additionalTaxSettingsObjects = [];
      for (const taxId of invoiceData.AdditionalTaxSettings) {
        const taxObj = await this.dataService.TaxSettings.get(taxId);
        if (taxObj) additionalTaxSettingsObjects.push(taxObj);
      }
    }

    // Calculate totals from libelles (pass additional taxes and timbre)
    const totals: any = this.invoiceFactory.calculateInvoiceTotals(
      libelles,
      additionalTaxSettingsObjects,
      invoiceData.timbre ?? 1
    );

    // If invoice is international and montantInternational & tauxChange provided, convert
    if (invoiceData.typeDevis && invoiceData.montantInternational && invoiceData.tauxChange) {
      const converted = this.convertMontantSelonDevis(invoiceData.montantInternational, invoiceData.tauxChange);
      // Override totals totalTTC and totalTTC_final with converted amount (as DT)
      totals.totalTTC = converted.toFixed(2);
      const timbreVal = totals.timbre ? parseFloat(totals.timbre) : 0;
      totals.totalTTC_final = (converted + timbreVal).toFixed(2);
      totals.montantInternational = invoiceData.montantInternational;
    }

    return totals;
  }

  async createInvoice(user: RequestUser, invoiceToCreate: CreateInvoiceDto): Promise<Invoice> {
    const resolvedInvoiceType = invoiceToCreate.invoiceType ?? invoiceType.selling;

    if (!this.isAdmin(user.roles)) {
      if (!invoiceToCreate.mycompanyId) {
        throw new ForbiddenException('mycompanyId is required.');
      }
      await this.assertCompanyMembership(user._id, invoiceToCreate.mycompanyId, [CompanyRole.ACCOUNTANT]);
    }

    if (resolvedInvoiceType === invoiceType.selling && !invoiceToCreate.clientId) {
      throw new BadRequestException('Client is required for selling invoices.');
    }

    if (resolvedInvoiceType === invoiceType.buying && !invoiceToCreate.supplierId) {
      throw new BadRequestException('Supplier is required for buying invoices.');
    }

    if (invoiceToCreate.clientId) {
      const client = await this.dataService.company.get(invoiceToCreate.clientId);
      if (!client) throw new NotFoundException('Client not found.');
      if (client.companyType !== companyType.client) {
        throw new BadRequestException('Selected company is not a client.');
      }
    }

    if (invoiceToCreate.supplierId) {
      const supplier = await this.dataService.company.get(invoiceToCreate.supplierId);
      if (!supplier) throw new NotFoundException('Supplier not found.');
      if (supplier.companyType !== companyType.supplier) {
        throw new BadRequestException('Selected company is not a supplier.');
      }
    }
    // Validate that libelles are provided
    if (!invoiceToCreate.Libelle || invoiceToCreate.Libelle.length === 0) {
      throw new BadRequestException('Invoice must have at least one libelle.');
    }
    // Get libelles to calculate totals
    const libelles: Libelle[] = [];
    for (const libelleId of invoiceToCreate.Libelle) {
      const libelle = await this.dataService.libelle.get(libelleId);
      if (!libelle) {
        throw new NotFoundException(`Libelle with ID ${libelleId} not found.`);
      }
      libelles.push(libelle);
    }

    // Fetch additional tax settings objects if provided
    let additionalTaxSettingsObjects: any[] | undefined = undefined;
    if (invoiceToCreate.AdditionalTaxSettings && invoiceToCreate.AdditionalTaxSettings.length > 0) {
      additionalTaxSettingsObjects = [];
      for (const taxId of invoiceToCreate.AdditionalTaxSettings) {
        const taxObj = await this.dataService.TaxSettings.get(taxId);
        if (taxObj) additionalTaxSettingsObjects.push(taxObj);
      }
    }

    // Calculate totals from libelles (pass additional taxes and timbre)
    const totals = this.invoiceFactory.calculateInvoiceTotals(
      libelles,
      additionalTaxSettingsObjects,
      invoiceToCreate.timbre ?? 1
    );

    // If invoice is international and montantInternational & tauxChange provided, convert
    if (invoiceToCreate.typeDevis && invoiceToCreate.montantInternational && invoiceToCreate.tauxChange) {
      const converted = this.convertMontantSelonDevis(invoiceToCreate.montantInternational, invoiceToCreate.tauxChange);
      // Override totals totalTTC and totalTTC_final with converted amount (as DT)
      totals.totalTTC = converted.toFixed(2);
      const timbreVal = totals.timbre ? parseFloat(totals.timbre) : 0;
      totals.totalTTC_final = (converted + timbreVal).toFixed(2);
    }

    // Generate invoice number
    const lastInvoiceNumber = await this.getLastInvoiceNumber();
    const invoiceNumber = this.invoiceFactory.generateInvoiceNumber(lastInvoiceNumber);

    // Create invoice with calculated values
    const invoice = this.invoiceFactory.createInvoice(
      invoiceToCreate,
      invoiceNumber,
      libelles,
      totals
    );

    return await this.dataService.invoice.create(invoice);
  }

  async updateInvoice(user: RequestUser, id: string, invoiceToUpdate: UpdateInvoiceDto): Promise<Invoice> {
    const existingInvoice = await this.dataService.invoice.get(id);
    if (!existingInvoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = existingInvoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    // If libelles are updated, recalculate totals
    let totals: { totalHT: string; totalTTC: string; totalTax: string; totalDiscount: string; timbre?: string; totalTTC_final?: string } | undefined;
    let libelles: Libelle[] | undefined;

    if (invoiceToUpdate.Libelle && invoiceToUpdate.Libelle.length > 0) {
      libelles = [];
      for (const libelleId of invoiceToUpdate.Libelle) {
        const libelle = await this.dataService.libelle.get(libelleId);
        if (!libelle) {
          throw new NotFoundException(`Libelle with ID ${libelleId} not found.`);
        }
        libelles.push(libelle);
      }

      // Fetch additional tax settings objects if provided
      let additionalTaxSettingsObjects: any[] | undefined = undefined;
      if (invoiceToUpdate.AdditionalTaxSettings && invoiceToUpdate.AdditionalTaxSettings.length > 0) {
        additionalTaxSettingsObjects = [];
        for (const taxId of invoiceToUpdate.AdditionalTaxSettings) {
          const taxObj = await this.dataService.TaxSettings.get(taxId);
          if (taxObj) additionalTaxSettingsObjects.push(taxObj);
        }
      }

      totals = this.invoiceFactory.calculateInvoiceTotals(libelles, additionalTaxSettingsObjects, invoiceToUpdate.timbre ?? 1);

      // If international with montantInternational & tauxChange provided, convert
      if (invoiceToUpdate.typeDevis && invoiceToUpdate.montantInternational && invoiceToUpdate.tauxChange) {
        const converted = this.convertMontantSelonDevis(invoiceToUpdate.montantInternational, invoiceToUpdate.tauxChange);
        totals.totalTTC = converted.toFixed(2);
        const timbreVal = totals.timbre ? parseFloat(totals.timbre) : 0;
        totals.totalTTC_final = (converted + timbreVal).toFixed(2);
      }
    }

    const invoice = this.invoiceFactory.updateInvoice(invoiceToUpdate, libelles, totals);

    if (totals?.totalTTC) {
      const paidAmount = Number(existingInvoice.paidAmount || 0);
      const totalTTC = Number(totals.totalTTC_final || totals.totalTTC);
      const remainingAmount = Math.max(0, totalTTC - paidAmount);
      invoice.remainingAmount = remainingAmount;
    }
    return await this.dataService.invoice.update(id, invoice);
  }

  async addInvoicePayment(user: RequestUser, id: string, payload: AddInvoicePaymentDto): Promise<Invoice> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = invoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    const totalTTC = Number(invoice.totalTTC || 0);
    const paidAmount = Number(invoice.paidAmount || 0);
    const remainingAmount = Math.max(0, totalTTC - paidAmount);

    if (payload.amount > remainingAmount) {
      throw new BadRequestException('Payment amount exceeds remaining balance.');
    }

    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    payments.push({
      amount: payload.amount,
      date: payload.date,
      paymentType: payload.paymentType,
      proofUrl: payload.proofUrl,
      notes: payload.notes,
    });

    const nextPaidAmount = paidAmount + payload.amount;
    const nextRemainingAmount = Math.max(0, totalTTC - nextPaidAmount);

    const updatePayload = {
      payments,
      paidAmount: nextPaidAmount,
      remainingAmount: nextRemainingAmount,
      invoiceStatus: nextRemainingAmount === 0 ? invoiceStatus.paid : invoice.invoiceStatus,
    } as any;

    return await this.dataService.invoice.update(id, updatePayload);
  }

  async deleteInvoice(user: RequestUser, id: string): Promise<boolean> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = invoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    return await this.dataService.invoice.delete(id);
  }

  async generateInvoicePdf(user: RequestUser, id: string): Promise<Buffer> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = invoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    const vatMap = new Map<number, { base: number; tva: number }>();
    const libelles = Array.isArray(invoice.Libelle) ? invoice.Libelle : [];

    for (const line of libelles as any[]) {
      const base = parseFloat(line.finalprixHT || '0');
      const ttc = parseFloat(line.finalprixTTC || '0');
      const tvaAmount = Math.max(0, ttc - base);

      let rate = 0;
      if (line.TaxSettingsId?.taxprice !== undefined) {
        rate = Number(line.TaxSettingsId.taxprice);
      } else if (line.TaxSettingsId) {
        const taxSetting = await this.dataService.TaxSettings.get(line.TaxSettingsId);
        rate = taxSetting ? Number(taxSetting.taxprice || 0) : 0;
      } else if (base > 0) {
        rate = (tvaAmount / base) * 100;
      }

      const key = Number(rate.toFixed(2));
      const existing = vatMap.get(key) || { base: 0, tva: 0 };
      vatMap.set(key, {
        base: existing.base + base,
        tva: existing.tva + tvaAmount,
      });
    }

    const vatRows: VatSummaryRow[] = Array.from(vatMap.entries())
      .map(([rate, values]) => ({ rate, base: values.base, tva: values.tva }))
      .sort((a, b) => a.rate - b.rate);

    const totals: InvoicePdfTotals = {
      totalHT: parseFloat(invoice.totalHT || '0'),
      totalTVA: parseFloat(invoice.totalTax || '0'),
      timbre: typeof invoice.timbre === 'number' ? invoice.timbre : 0,
      totalTTC: parseFloat(invoice.totalTTC || '0'),
    };

    const fromLabel = invoice.mycompanyId?.companyname || 'Ma societe';
    const toLabel = invoice.invoiceType === invoiceType.buying
      ? (invoice.supplierId?.companyname || 'Fournisseur')
      : (invoice.clientId?.companyname || 'Client');

    return buildInvoicePdfBuffer({
      invoice,
      totals,
      vatRows,
      fromLabel,
      toLabel,
    });
  }

  async generateInvoiceXml(user: RequestUser, id: string): Promise<Buffer> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = invoice.mycompanyId?.toString();
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    return this.xmlGeneratorUseCases.generateInvoiceXml(invoice);
  }

  private isAdmin(roles?: string[]): boolean {
    return roles?.includes(Role.SUPERADMIN) ?? false;
  }

  private async assertCompanyMembership(
    userId: string,
    companyId: string,
    allowedRoles: CompanyRole[]
  ): Promise<void> {
    const membership = await this.dataService.companyMembership.findAllByAttributeWithFilter(
      {
        deletedAt: null,
        userId: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
      },
      1,
      1
    );

    if (!membership || membership.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles.length && !allowedRoles.includes(membership[0].role)) {
      throw new ForbiddenException('Insufficient role for this action.');
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(user: RequestUser, companyId?: string): Promise<{
    totalInvoices: number;
    totalAmount: number;
    byStatus: { [key: string]: number };
  }> {
    const isAdmin = this.isAdmin(user.roles);
    const query: any = { deletedAt: null };

    if (companyId) {
      query.mycompanyId = new Types.ObjectId(companyId);
    }

    if (!isAdmin) {
      if (!companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    const allInvoices = await this.dataService.invoice.findAllByAttributeWithFilter(query, 1, 100000);

    const stats = {
      totalInvoices: allInvoices.length,
      totalAmount: 0,
      byStatus: {} as { [key: string]: number }
    };

    for (const invoice of allInvoices) {
      if (invoice.totalTTC) {
        stats.totalAmount += parseFloat(invoice.totalTTC);
      }

      const status = invoice.invoiceStatus || 'draft';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get invoices by date range
   */
  async getInvoicesByDateRange(user: RequestUser, startDate: string, endDate: string, companyId?: string): Promise<Invoice[]> {
    const isAdmin = this.isAdmin(user.roles);
    const query: any = {
      dateInvoice: {
        $gte: startDate,
        $lte: endDate
      },
      deletedAt: null
    };

    if (companyId) {
      query.mycompanyId = new Types.ObjectId(companyId);
    }

    if (!isAdmin) {
      if (!companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.ACCOUNTANT]);
    }

    return await this.dataService.invoice.findAllByAttributeWithFilter(query, 1, 1000, { createdAt: -1 });
  }
}
