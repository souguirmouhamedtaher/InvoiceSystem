export type CompanyType = 'mycompany' | 'client';

export type Client = {
  _id: string;
  companyname: string;
  companyType: CompanyType;
  address: string;
  email: string;
  phones: string[];
  city?: string;
  country?: string;
  notes?: string;
  ResponsibleName?: string;
  ResponsibleEmail?: string;
  ResponsiblePhone?: string;
};

export type CreateClientPayload = {
  companyname: string;
  companyType: CompanyType;
  address: string;
  email: string;
  phones: string[];
  city?: string;
  country?: string;
  notes?: string;
  ResponsibleName?: string;
  ResponsibleEmail?: string;
  ResponsiblePhone?: string;
};

export type ClientListResponse = {
  companies: Client[];
  totalCompanies: number;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;
