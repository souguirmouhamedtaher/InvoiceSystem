import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Invoice, Libelle } from 'src/domain/entities';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dtos';
import { InvoiceFactory } from '../factoryMapper';

@Injectable()
export class InvoiceUseCases {
  constructor(
    private dataService: IDataServices,
    private invoiceFactory: InvoiceFactory
  ) { }

  async getAllInvoices(
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ invoices: Invoice[]; totalInvoices: number }> {
    const query: any = { deletedAt: null };
    const orQueries: any[] = [];

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
        } else if (key === 'clientType' && value) {
          query.clientType = value;
        } else if (key === 'paymentType' && value) {
          query.paymentType = value;
        } else if (key === 'invoiceStatus' && value) {
          query.invoiceStatus = value;
        } else if (key === 'dateFrom' && value) {
          query.dateInvoice = { ...query.dateInvoice, $gte: value };
        } else if (key === 'dateTo' && value) {
          query.dateInvoice = { ...query.dateInvoice, $lte: value };
        } else {
          query[key] = value;
        }
      }
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const invoices = await this.dataService.invoice.findAllByAttributeWithFilter(finalQuery, page, limit, { createdAt: -1 });
    const totalInvoices = await this.dataService.invoice.count(finalQuery);

    return { invoices, totalInvoices };
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');
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
  async calculateInvoice(invoiceData: CreateInvoiceDto): Promise<{
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

  async createInvoice(invoiceToCreate: CreateInvoiceDto): Promise<Invoice> {
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

  async updateInvoice(id: string, invoiceToUpdate: UpdateInvoiceDto): Promise<Invoice> {
    const existingInvoice = await this.dataService.invoice.get(id);
    if (!existingInvoice) throw new NotFoundException('Invoice not found.');

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
    return await this.dataService.invoice.update(id, invoice);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoice = await this.dataService.invoice.get(id);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    return await this.dataService.invoice.delete(id);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<{
    totalInvoices: number;
    totalAmount: number;
    byStatus: { [key: string]: number };
  }> {
    const allInvoices = await this.dataService.invoice.getAll();

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
  async getInvoicesByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    const query = {
      dateInvoice: {
        $gte: startDate,
        $lte: endDate
      },
      deletedAt: null
    };

    return await this.dataService.invoice.findAllByAttributeWithFilter(query, 1, 1000, { createdAt: -1 });
  }
}
