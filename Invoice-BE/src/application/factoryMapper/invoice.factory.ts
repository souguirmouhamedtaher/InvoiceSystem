import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Invoice } from 'src/domain/entities';
import { invoiceType } from 'src/domain/enums/invoice.enums';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dtos';

@Injectable()
export class InvoiceFactory {
  /**
   * Generate invoice number in format YYYY-NNNN
   * @param lastInvoiceNumber - The last invoice number (e.g., "2025-0003")
   * @returns New invoice number (e.g., "2025-0004")
   */
  generateInvoiceNumber(lastInvoiceNumber: string | null): string {
    const currentYear = new Date().getFullYear();

    if (!lastInvoiceNumber) {
      return `${currentYear}-0001`;
    }

    const [year, number] = lastInvoiceNumber.split('-');
    const lastYear = parseInt(year);
    const lastNumber = parseInt(number);

    // If year changed, reset to 0001
    if (currentYear > lastYear) {
      return `${currentYear}-0001`;
    }

    // Increment number and pad with zeros
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${currentYear}-${newNumber}`;
  }

  /**
   * Calculate invoice totals from libelles
   * @param libelles - Array of libelle objects
   * @param additionalTaxSettings - Array of tax objects (optional, to check for retenue)
   * @param timbreParam - Timbre value (default 1)
   * @returns Object with totalHT, totalTTC, totalTax, totalDiscount, etc.
   */
  calculateInvoiceTotals(
    libelles: any[],
    additionalTaxSettings?: Array<{ _id: string; taxType: string; taxprice: number }>,
    timbreParam: number = 1
  ): {
    totalHT: string;
    totalTTC: string;
    totalTax: string;
    totalDiscount: string;
    retenue?: string;
    totalTTC_apres_retenue?: string;
    timbre?: string;
    totalTTC_final?: string;
  } {
    let totalHT = 0;
    let totalTTC = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let retenue = 0;
    let totalTTC_apres_retenue = 0;

    for (const libelle of libelles) {
      // Accumulate final HT and TTC
      if (libelle.finalprixHT) {
        totalHT += parseFloat(libelle.finalprixHT);
      }
      if (libelle.finalprixTTC) {
        totalTTC += parseFloat(libelle.finalprixTTC);
      }

      // Calculate discount for this libelle
      const prixHT = parseFloat(libelle.prixHT || '0');
      const qte = libelle.qte || 0;
      const totalBeforeDiscount = prixHT * qte;
      const finalprixHT = parseFloat(libelle.finalprixHT || '0');
      const discountAmount = totalBeforeDiscount - finalprixHT;
      totalDiscount += discountAmount;

      // Calculate tax for this libelle (TTC - HT = Tax)
      const finalprixTTC = parseFloat(libelle.finalprixTTC || '0');
      const taxAmount = finalprixTTC - finalprixHT;
      totalTax += taxAmount;
    }

    // Vérifier la présence de la taxe RE (retenue à la source)
    let hasRetenue = false;
    if (additionalTaxSettings && Array.isArray(additionalTaxSettings)) {
      hasRetenue = additionalTaxSettings.some(
        (tax) => tax.taxType === 'RE' && tax.taxprice === 1
      );
    }

    // Appliquer la retenue si totalTTC > 1000 et la taxe RE est présente
    if (hasRetenue && totalTTC > 1000) {
      retenue = totalTTC * 0.01;
      totalTTC_apres_retenue = totalTTC - retenue;
    } else {
      totalTTC_apres_retenue = totalTTC;
    }

    // Ajouter timbre (1D) au total final
    const timbre = typeof timbreParam === 'number' ? timbreParam : 1;
    const totalTTC_final = totalTTC_apres_retenue + timbre;

    return {
      totalHT: totalHT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      retenue: hasRetenue && totalTTC > 1000 ? retenue.toFixed(2) : '0.00',
      totalTTC_apres_retenue: totalTTC_apres_retenue.toFixed(2),
      timbre: timbre.toFixed(2),
      totalTTC_final: totalTTC_final.toFixed(2)
    };
  }

  createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    invoiceNumber: string,
    libelles?: any[],
    totals?: {
      totalHT: string;
      totalTTC: string;
      totalTax: string;
      totalDiscount: string;
      timbre?: string;
      totalTTC_final?: string;
    }
  ): Invoice {
    const newInvoice = new Invoice();

    newInvoice.username = createInvoiceDto.username;
    newInvoice.dateInvoice = createInvoiceDto.dateInvoice;
    if (createInvoiceDto.applicationName) newInvoice.applicationName = createInvoiceDto.applicationName;
    newInvoice.clientType = createInvoiceDto.clientType;
    newInvoice.invoiceType = createInvoiceDto.invoiceType ?? invoiceType.selling;
    if (createInvoiceDto.invoiceStatus) newInvoice.invoiceStatus = createInvoiceDto.invoiceStatus;

    // Ajout international: typeDevis et montantInternational
    if (createInvoiceDto.typeDevis) newInvoice.typeDevis = createInvoiceDto.typeDevis;
    if (createInvoiceDto.montantInternational) newInvoice.montantInternational = createInvoiceDto.montantInternational;

    // Set invoice number (auto-generated)
    newInvoice.invoiceNumber = invoiceNumber;

    // Set totals (calculated from libelles or provided)
    if (totals) {
      newInvoice.totalHT = totals.totalHT;
      // Use final total (including retenue and timbre) if available
      newInvoice.totalTTC = (totals.totalTTC_final || totals.totalTTC);
      newInvoice.totalTax = totals.totalTax;
      newInvoice.totalDiscount = totals.totalDiscount;
      // Set timbre if provided in totals
      if (totals.timbre) newInvoice.timbre = parseFloat(totals.timbre);
    } else if (createInvoiceDto.totalHT && createInvoiceDto.totalTTC) {
      newInvoice.totalHT = createInvoiceDto.totalHT;
      newInvoice.totalTTC = createInvoiceDto.totalTTC;
    }

    if (createInvoiceDto.fileUrl) newInvoice.fileUrl = createInvoiceDto.fileUrl;

    // Set default timbre value if not set
    if (typeof newInvoice.timbre === 'undefined') {
      newInvoice.timbre = createInvoiceDto.timbre ?? 1;
    }

    // Convert string IDs to ObjectIds
    if (createInvoiceDto.Libelle && createInvoiceDto.Libelle.length > 0) {
      newInvoice.Libelle = createInvoiceDto.Libelle.map(id => new Types.ObjectId(id)) as any;
    }

    if (createInvoiceDto.AdditionalTaxSettings && createInvoiceDto.AdditionalTaxSettings.length > 0) {
      newInvoice.AdditionalTaxSettings = createInvoiceDto.AdditionalTaxSettings.map(id => new Types.ObjectId(id)) as any;
    }
    if (!newInvoice.AdditionalTaxSettings) {
      newInvoice.AdditionalTaxSettings = [] as any;
    }

    if (createInvoiceDto.notes) newInvoice.notes = createInvoiceDto.notes;

    newInvoice.payments = [];
    newInvoice.paidAmount = 0;
    const totalToPay = parseFloat(newInvoice.totalTTC || '0');
    newInvoice.remainingAmount = Number.isFinite(totalToPay) ? totalToPay : 0;

    // Set optional client and company references
    if (createInvoiceDto.clientId) {
      newInvoice.clientId = new Types.ObjectId(createInvoiceDto.clientId) as any;
    }
    if (createInvoiceDto.companyId) newInvoice.companyId = new Types.ObjectId(createInvoiceDto.companyId) as any;

    newInvoice.Date = new Date();
    newInvoice.createdAt = new Date();
    newInvoice.updatedAt = new Date();

    return newInvoice;
  }

  updateInvoice(
    updateInvoiceDto: UpdateInvoiceDto,
    libelles?: any[],
    totals?: {
      totalHT: string;
      totalTTC: string;
      totalTax: string;
      totalDiscount: string;
      timbre?: string;
      totalTTC_final?: string;
    }
  ): Invoice {
    const updatedInvoice = new Invoice();

    if (updateInvoiceDto.username) updatedInvoice.username = updateInvoiceDto.username;
    if (updateInvoiceDto.dateInvoice) updatedInvoice.dateInvoice = updateInvoiceDto.dateInvoice;
    if (updateInvoiceDto.applicationName) updatedInvoice.applicationName = updateInvoiceDto.applicationName;
    if (updateInvoiceDto.clientType) updatedInvoice.clientType = updateInvoiceDto.clientType;
    if (updateInvoiceDto.invoiceType) updatedInvoice.invoiceType = updateInvoiceDto.invoiceType;
    if (updateInvoiceDto.invoiceStatus) updatedInvoice.invoiceStatus = updateInvoiceDto.invoiceStatus;

    // Ajout international: typeDevis et montantInternational
    if (updateInvoiceDto.typeDevis) updatedInvoice.typeDevis = updateInvoiceDto.typeDevis;
    if (updateInvoiceDto.montantInternational) updatedInvoice.montantInternational = updateInvoiceDto.montantInternational;

    // Update totals if libelles changed
    if (totals) {
      updatedInvoice.totalHT = totals.totalHT;
      // Use final total (including retenue and timbre) if available
      updatedInvoice.totalTTC = (totals.totalTTC_final || totals.totalTTC);
      updatedInvoice.totalTax = totals.totalTax;
      updatedInvoice.totalDiscount = totals.totalDiscount;
      // Set timbre if provided in totals
      if (totals.timbre) updatedInvoice.timbre = parseFloat(totals.timbre);
    } else if (updateInvoiceDto.totalHT && updateInvoiceDto.totalTTC) {
      updatedInvoice.totalHT = updateInvoiceDto.totalHT;
      updatedInvoice.totalTTC = updateInvoiceDto.totalTTC;
    }

    // Set default timbre value if not set
    if (typeof updatedInvoice.timbre === 'undefined') {
      updatedInvoice.timbre = updateInvoiceDto.timbre ?? 1;
    }

    // Update libelle references if provided
    if (updateInvoiceDto.Libelle && updateInvoiceDto.Libelle.length > 0) {
      updatedInvoice.Libelle = updateInvoiceDto.Libelle.map(id => new Types.ObjectId(id)) as any;
    }

    if (updateInvoiceDto.AdditionalTaxSettings && updateInvoiceDto.AdditionalTaxSettings.length > 0) {
      updatedInvoice.AdditionalTaxSettings = updateInvoiceDto.AdditionalTaxSettings.map(id => new Types.ObjectId(id)) as any;
    }
    if (!updatedInvoice.AdditionalTaxSettings) {
      updatedInvoice.AdditionalTaxSettings = [] as any;
    }

    if (updateInvoiceDto.notes) updatedInvoice.notes = updateInvoiceDto.notes;

    if (updateInvoiceDto.fileUrl) updatedInvoice.fileUrl = updateInvoiceDto.fileUrl;

    // Update optional client and company references
    if (updateInvoiceDto.clientId) {
      updatedInvoice.clientId = new Types.ObjectId(updateInvoiceDto.clientId) as any;
    }
    if (updateInvoiceDto.companyId) updatedInvoice.companyId = new Types.ObjectId(updateInvoiceDto.companyId) as any;

    updatedInvoice.updatedAt = new Date();

    return updatedInvoice;
  }
}
