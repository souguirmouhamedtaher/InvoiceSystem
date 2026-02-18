export type TvaPayment = {
  _id: string;
  month: string;
  amount: number;
  paymentDate: string;
  proofUrl?: string;
  notes?: string;
  companyId?: { _id: string; companyname: string } | string;
  paymentType?: 'cash' | 'creditCard' | 'bankTransfer' | 'paypal' | 'check' | 'cheque';
};

export type TvaPaymentListResponse = {
  payments: TvaPayment[];
  totalPayments: number;
};

export type CreateTvaPaymentPayload = {
  companyId: string;
  month: string;
  amount: number;
  paymentDate: string;
  paymentType: 'cash' | 'creditCard' | 'bankTransfer' | 'paypal' | 'check' | 'cheque';
  proofUrl?: string;
  notes?: string;
};

export type UpdateTvaPaymentPayload = Partial<CreateTvaPaymentPayload>;
