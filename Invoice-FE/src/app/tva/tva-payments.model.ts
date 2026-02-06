export type TvaPayment = {
  _id: string;
  month: string;
  amount: number;
  paymentDate: string;
  proofUrl?: string;
  notes?: string;
};

export type TvaPaymentListResponse = {
  payments: TvaPayment[];
  totalPayments: number;
};

export type CreateTvaPaymentPayload = {
  month: string;
  amount: number;
  paymentDate: string;
  proofUrl?: string;
  notes?: string;
};

export type UpdateTvaPaymentPayload = Partial<CreateTvaPaymentPayload>;
