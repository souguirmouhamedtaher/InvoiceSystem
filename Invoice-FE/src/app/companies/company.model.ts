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
  bankAccountNumber?: string;
  bankOwnerIdentifier?: string;
  bankInstitutionCode?: string;
  bankInstitutionName?: string;
  bankBranchCode?: string;
  bankCountry?: string;
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
  bankAccountNumber?: string;
  bankOwnerIdentifier?: string;
  bankInstitutionCode?: string;
  bankInstitutionName?: string;
  bankBranchCode?: string;
  bankCountry?: string;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export type CompanyListResponse = {
  companies: Company[];
  totalCompanies: number;
};
