export type Salary = {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string };
  month: string;
  netAmount: number;
  paidDate?: string;
  isPaid?: boolean;
  notes?: string;
};

export type SalaryListResponse = {
  salaries: Salary[];
  totalSalaries: number;
};

export type CreateSalaryPayload = {
  employeeId: string;
  month: string;
  netAmount: number;
  paidDate?: string;
  isPaid?: boolean;
  notes?: string;
};

export type UpdateSalaryPayload = Partial<CreateSalaryPayload>;
