export type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cnssApplicable: boolean;
  notes?: string;
};

export type EmployeeListResponse = {
  employees: Employee[];
  totalEmployees: number;
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cnssApplicable: boolean;
  notes?: string;
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
