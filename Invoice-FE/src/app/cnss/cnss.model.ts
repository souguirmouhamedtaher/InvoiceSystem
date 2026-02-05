export type CnssPayment = {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string };
  month: string;
  amount: number;
  paymentDate: string;
  notes?: string;
};

export type CnssListResponse = {
  payments: CnssPayment[];
  totalPayments: number;
};

export type CreateCnssPaymentPayload = {
  employeeId: string;
  month: string;
  amount: number;
  paymentDate: string;
  notes?: string;
};

export type UpdateCnssPaymentPayload = Partial<CreateCnssPaymentPayload>;
