export type Company = {
  _id: string;
  companyname: string;
  email: string;
  address: string;
  phones: string[];
  region?: string;
  country?: string;
  notes?: string;
  Patente?: string;
  bankName?: string;
  bankIBAN?: string;
  bankRib?: string;
  bankBIC?: string;
};

export type CreateCompanyPayload = {
  companyname: string;
  email: string;
  address: string;
  phones: string[];
  region?: string;
  country?: string;
  notes?: string;
  Patente?: string;
  bankName?: string;
  bankIBAN?: string;
  bankRib?: string;
  bankBIC?: string;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export type CompanyListResponse = {
  companies: Company[];
  totalCompanies: number;
};
