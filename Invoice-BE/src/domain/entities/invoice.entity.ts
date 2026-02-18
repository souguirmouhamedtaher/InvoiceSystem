import { Base } from './base.entity';
import { clientType, invoiceStatus, invoiceType } from '../enums/invoice.enums';
import { TaxSettings } from './taxesSettings.entity';
import { Libelle } from './libelle.entity';
import { Company } from './company.entity';
import { Client } from './client.entity';

export class Invoice extends Base {
	username: string;
	dateInvoice: string;
	applicationName: string;
	clientType: clientType;
	invoiceType?: invoiceType;
	invoiceStatus: invoiceStatus;
	AdditionalTaxSettings: TaxSettings[];
	Libelle: Libelle[];
	invoiceNumber: string;
	totalTTC: string;
	totalHT: string;
	totalTax: string;
	totalDiscount: string;
	fileUrl?: string;
	Date: Date;
	notes: string;
	typeDevis?: string;
	montantInternational?: number;
	/** Stamp duty (timbre) in DT, default 1 */
	timbre?: number;
	/** Optional reference to Client */
	clientId?: Client;
	/** Reference to Enterprise */
	companyId: Company;
	payments?: {
		amount: number;
		date: string;
		paymentType: string;
		proofUrl?: string;
		notes?: string;
	}[];
	paidAmount?: number;
	remainingAmount?: number;
}