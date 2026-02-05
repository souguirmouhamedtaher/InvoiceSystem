export type PaymentType = 'cash' | 'creditCard' | 'bankTransfer' | 'paypal' | 'check' | 'cheque';
export type ClientType = 'national' | 'international';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DevisType = 'TND' | 'EUR' | 'USD' | 'GBP';

export type InvoiceLineInput = {
  name: string;
  description?: string;
  qte: number;
  prixHT: string;
  taxSettingsId: string;
  productType: 'product' | 'service' | 'donation';
  unity: 'kg' | 'm' | 'hours' | 'day' | 'article' | 'month' | 'year';
};

export type InvoiceTotals = {
  totalHT: string;
  totalTTC: string;
  totalTax: string;
  totalDiscount: string;
  timbre?: string;
  retenue?: string;
  totalTTC_apres_retenue?: string;
  totalTTC_final?: string;
};

export type Invoice = {
  _id: string;
  username: string;
  dateInvoice: string;
  applicationName?: string;
  paymentType?: PaymentType;
  clientType: ClientType;
  invoiceStatus?: InvoiceStatus;
  AdditionalTaxSettings: Array<{ _id: string; name: string; taxType: string; taxprice: number }>;
  Libelle: Array<{
    _id: string;
    name: string;
    qte: number;
    prixHT: string;
    prixTTC: string;
    finalprixHT: string;
    finalprixTTC: string;
  }>;
  invoiceNumber: string;
  totalTTC: string;
  totalHT: string;
  totalTax: string;
  totalDiscount: string;
  timbre?: number;
  notes?: string;
  clientId?: { _id: string; companyname: string; email: string };
  mycompanyId?: { _id: string; companyname: string; email: string };
};

export type CreateInvoicePayload = {
  username: string;
  dateInvoice: string;
  applicationName?: string;
  paymentType?: PaymentType;
  clientType: ClientType;
  invoiceStatus?: InvoiceStatus;
  AdditionalTaxSettings?: string[];
  Libelle: string[];
  timbre?: number;
  notes?: string;
  clientId?: string;
  mycompanyId?: string;
};

export type InvoiceCalculatePayload = CreateInvoicePayload;

export type InvoiceListResponse = {
  invoices: Invoice[];
  totalInvoices: number;
};
