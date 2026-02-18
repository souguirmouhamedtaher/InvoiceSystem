import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Invoice, Libelle, TtnSimulation } from 'src/domain/entities';
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
        } else if (key === 'companyId' && typeof value === 'string') {
          companyIdFilter = value;
          query.companyId = new Types.ObjectId(value);
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
      await this.assertCompanyMembership(user._id, companyIdFilter, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      if (!invoiceData.companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, invoiceData.companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      if (!invoiceToCreate.companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, invoiceToCreate.companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    if (resolvedInvoiceType === invoiceType.selling && !invoiceToCreate.clientId) {
      throw new BadRequestException('Client is required for selling invoices.');
    }

    if (invoiceToCreate.clientId) {
      const client = await this.dataService.client.get(invoiceToCreate.clientId);
      if (!client) throw new NotFoundException('Client not found.');
      const clientCompanyId = (client as any).companyId?._id ?? (client as any).companyId;
      if (clientCompanyId && String(clientCompanyId) !== String(invoiceToCreate.companyId)) {
        throw new BadRequestException('Client does not belong to this company.');
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

    (invoice as any).userId = new Types.ObjectId(user._id);
    return await this.dataService.invoice.create(invoice);
  }

  async updateInvoice(user: RequestUser, id: string, invoiceToUpdate: UpdateInvoiceDto): Promise<Invoice> {
    const existingInvoice = await this.dataService.invoice.get(id);
    if (!existingInvoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = this.getInvoiceCompanyId(existingInvoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    return await this.dataService.invoice.delete(id);
  }

  async generateInvoicePdf(user: RequestUser, id: string): Promise<Buffer> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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

    const fromLabel = (invoice as any).companyId?.companyname || 'Ma societe';
    const toLabel = (invoice as any).clientId?.name || 'Client';

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
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    return this.xmlGeneratorUseCases.generateInvoiceXml(invoice);
  }

  async submitTtnSimulation(user: RequestUser, id: string): Promise<TtnSimulation> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    const start = Date.now();
    const xmlBuffer = await this.xmlGeneratorUseCases.generateInvoiceXml(invoice);
    const requestXml = xmlBuffer.toString('utf-8');
    const errors = this.validateInvoiceForTtn(invoice);
    const status = errors.length ? 'REJECTED' : 'ACCEPTED';
    const reference = status === 'ACCEPTED' ? this.generateTtnReference(invoice) : undefined;
    const responseXml = this.buildTtnResponseXml(status, reference, errors);

    const companyId = this.getInvoiceCompanyId(invoice);
    if (!companyId) {
      throw new BadRequestException('companyId is required for TTN simulation.');
    }
    const payload = {
      invoiceId: new Types.ObjectId(invoice._id),
      companyId: new Types.ObjectId(companyId),
      userId: new Types.ObjectId(user._id),
      requestXml,
      responseXml,
      status,
      reference,
      errors,
      source: 'manual',
      submittedAt: new Date(),
      processedAt: new Date(),
      durationMs: Date.now() - start,
    } as any;

    return await this.dataService.ttnSimulation.create(payload);
  }

  async getTtnSimulationHistory(user: RequestUser, id: string): Promise<{ simulations: TtnSimulation[] }> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (!this.isAdmin(user.roles)) {
      const companyId = this.getInvoiceCompanyId(invoice);
      if (!companyId) {
        throw new ForbiddenException('Access denied');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    const filter = { invoiceId: new Types.ObjectId(invoice._id), deletedAt: null } as any;
    const simulations = await this.dataService.ttnSimulation.findAllByAttributeWithFilter(
      filter,
      1,
      50,
      { createdAt: -1 }
    );

    return { simulations: simulations || [] };
  }

  private isAdmin(roles?: string[]): boolean {
    return roles?.includes(Role.SUPERADMIN) ?? false;
  }

  private getInvoiceCompanyId(invoice: Invoice): string | undefined {
    const value = (invoice as any).companyId;
    if (value == null) return undefined;
    const id = (typeof value === 'object' && value !== null && '_id' in value) ? (value._id ?? value) : value;
    return id?.toString?.() ?? undefined;
  }

  private validateInvoiceForTtn(invoice: Invoice): string[] {
    const errors: string[] = [];
    const seller = (invoice as any).companyId;
    const buyer = (invoice as any).clientId;
    const payments = Array.isArray((invoice as any).payments) ? (invoice as any).payments : [];

    if (!invoice.invoiceNumber) errors.push('Missing invoice number.');
    if (!invoice.dateInvoice) errors.push('Missing invoice date.');
    if (!seller) errors.push('Missing seller (company).');
    if (seller && !seller.Patente) errors.push('Missing seller tax identifier (Patente).');
    if (!buyer) errors.push('Missing buyer (client).');
    if (buyer && !buyer.taxId && !buyer.Patente) errors.push('Missing buyer tax identifier.');
    if (!Array.isArray(invoice.Libelle) || invoice.Libelle.length === 0) {
      errors.push('Missing invoice lines.');
    }
    if (!invoice.totalTTC) errors.push('Missing total TTC.');
    if (!invoice.totalHT) errors.push('Missing total HT.');

    for (const payment of payments) {
      if (!payment?.amount || Number(payment.amount) <= 0) {
        errors.push('Payment amount must be greater than 0.');
      }
      if (!payment?.date) {
        errors.push('Payment date is required.');
      }
      if (!payment?.paymentType) {
        errors.push('Payment type is required.');
      }
      if (payment?.paymentType === 'bankTransfer') {
        const accountNumber = seller?.bankAccountNumber || seller?.bankRib || seller?.bankIBAN;
        if (!accountNumber) {
          errors.push('Bank transfer requires company bank account details.');
        }
      }
    }

    return errors;
  }

  private generateTtnReference(invoice: Invoice): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const shortId = String(invoice._id || '').slice(-6) || Math.random().toString(36).slice(2, 8).toUpperCase();
    return `TTN-SIM-${y}${m}${d}-${shortId}`;
  }

  private buildTtnResponseXml(status: string, reference?: string, errors?: string[]): string {
    const safeErrors = Array.isArray(errors) ? errors : [];
    const errorItems = safeErrors
      .map((err) => `    <Error>${this.escapeXml(err)}</Error>`)
      .join('\n');
    const errorBlock = errorItems ? `\n  <Errors>\n${errorItems}\n  </Errors>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<TTNResponse>\n` +
      `  <Status>${this.escapeXml(status)}</Status>\n` +
      `  <Reference>${this.escapeXml(reference || '')}</Reference>${errorBlock}\n` +
      `</TTNResponse>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async assertCompanyMembership(
    userId: string,
    companyId: string,
    allowedRoles: CompanyRole[]
  ): Promise<void> {
    if (allowedRoles.includes(CompanyRole.OWNER)) {
      const owned = await this.dataService.company.findAllByAttributeWithFilter(
        { _id: new Types.ObjectId(companyId), userId: new Types.ObjectId(userId) },
        1,
        1
      );
      if (owned?.length) return;
    }

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

    const role = (membership[0].role as string)?.toLowerCase?.() ?? membership[0].role;
    const rolesToCheck = allowedRoles.filter((r) => r !== CompanyRole.OWNER) as string[];
    if (rolesToCheck.length && !rolesToCheck.includes(role)) {
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
      query.companyId = new Types.ObjectId(companyId);
    }

    if (!isAdmin) {
      if (!companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
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
      query.companyId = new Types.ObjectId(companyId);
    }

    if (!isAdmin) {
      if (!companyId) {
        throw new ForbiddenException('companyId is required.');
      }
      await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.ACCOUNTANT]);
    }

    return await this.dataService.invoice.findAllByAttributeWithFilter(query, 1, 1000, { createdAt: -1 });
  }
}
