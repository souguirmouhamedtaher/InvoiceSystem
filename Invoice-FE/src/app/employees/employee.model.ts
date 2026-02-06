export type Employee = {
  _id: string;
  companyId?: { _id: string; companyname: string };
  companyName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cnssApplicable: boolean;
  monthlyNetSalary?: number;
  cnssRatePercent?: number;
  notes?: string;
};

export type EmployeeListResponse = {
  employees: Employee[];
  totalEmployees: number;
};

export type CreateEmployeePayload = {
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cnssApplicable: boolean;
  monthlyNetSalary: number;
  cnssRatePercent?: number;
  notes?: string;
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
