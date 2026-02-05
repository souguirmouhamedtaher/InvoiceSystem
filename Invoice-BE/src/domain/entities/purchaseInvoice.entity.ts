import { Base } from './base.entity';
import { paymentType, clientType } from '../enums/invoice.enums';

export class PurchaseInvoice extends Base {
    invoiceName: string;
    companyId: any; // Reference to Company
    date: string;
    amountHT: string;
    tva: string;
    amountTTC: string;
    file: string;
    isPaid: boolean;
    paymentType: paymentType;
    clientType: clientType;
    notes?: string;
}
