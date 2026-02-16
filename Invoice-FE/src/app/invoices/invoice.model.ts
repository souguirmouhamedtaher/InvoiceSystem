export type ClientType = 'national' | 'international';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DevisType = 'TND' | 'EUR' | 'USD' | 'GBP';
export type InvoiceType = 'selling' | 'buying';

export type InvoiceLineInput = {
  name: string;
  description?: string;
  qte: number;
  prixHT: string;
  taxSettingsId: string;
  productType: 'product' | 'service' | 'donation';
  unity: 'kg' | 'm' | 'hours' | 'day' | 'article' | 'month' | 'year';
};

export type InvoicePayment = {
  amount: number;
  date: string;
  paymentType: 'cash' | 'creditCard' | 'bankTransfer' | 'paypal' | 'check' | 'cheque';
  proofUrl?: string;
  notes?: string;
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
  clientType: ClientType;
  invoiceType?: InvoiceType;
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
  fileUrl?: string;
  timbre?: number;
  notes?: string;
  payments?: InvoicePayment[];
  paidAmount?: number;
  remainingAmount?: number;
  clientId?: { _id: string; name: string; email: string };
  supplierId?: { _id: string; name: string; email: string };
  companyId?: { _id: string; companyname: string; email: string };
};

export type AddInvoicePaymentPayload = InvoicePayment;

export type CreateInvoicePayload = {
  username: string;
  dateInvoice: string;
  applicationName?: string;
  clientType: ClientType;
  invoiceType?: InvoiceType;
  invoiceStatus?: InvoiceStatus;
  AdditionalTaxSettings?: string[];
  Libelle: string[];
  timbre?: number;
  fileUrl?: string;
  notes?: string;
  clientId?: string;
  supplierId?: string;
  companyId?: string;
};

export type InvoiceCalculatePayload = CreateInvoicePayload;

export type InvoiceListResponse = {
  invoices: Invoice[];
  totalInvoices: number;
};

