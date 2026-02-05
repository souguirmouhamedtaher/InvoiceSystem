import { Base } from './base.entity';
import { paymentType, clientType, invoiceStatus } from '../enums/invoice.enums';
import { TaxSettings } from './taxesSettings.entity';
import { Libelle } from './libelle.entity';
import { Company } from './company.entity';

export class Invoice extends Base {
	username: string;
	dateInvoice: string;
	applicationName: string;
	paymentType: paymentType;
	clientType: clientType;
	invoiceStatus: invoiceStatus;
	AdditionalTaxSettings: TaxSettings[];
	Libelle: Libelle[];
	invoiceNumber: string;
	totalTTC: string;
	totalHT: string;
	totalTax: string;
	totalDiscount: string;
	Date: Date;
	notes: string;
	typeDevis?: string;
	montantInternational?: number;
	/** Stamp duty (timbre) in DT, default 1 */
	timbre?: number;
	/** Optional reference to Client (Company) */
	clientId?:  any;
	/** Optional reference to MyCompany (Company) */
	mycompanyId?: any;
}