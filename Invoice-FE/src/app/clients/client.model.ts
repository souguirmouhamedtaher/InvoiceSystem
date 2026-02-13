export type CompanyType = 'mycompany' | 'client' | 'supplier';

export type Client = {
  _id: string;
  companyname: string;
  companyType: CompanyType;
  logo?: string;
  Patente?: string;
  bankName?: string;
  bankIBAN?: string;
  bankRib?: string;
  bankBIC?: string;
  address: string;
  email: string;
  phones: string[];
  ResponsibleName?: string;
  ResponsibleEmail?: string;
  ResponsiblePhone?: string;
  companySector?: string;
  companySubSector?: string;
  supplierType?: string;
  accountingEmail?: string;
  vatIncluded?: boolean;
  country?: string;
  city?: string;
  notes?: string;
};

export type CreateClientPayload = {
  companyname: string;
  companyType: CompanyType;
  logo?: string;
  Patente?: string;
  bankName?: string;
  bankIBAN?: string;
  bankRib?: string;
  bankBIC?: string;
  address: string;
  email: string;
  phones: string[];
  ResponsibleName?: string;
  ResponsibleEmail?: string;
  ResponsiblePhone?: string;
  companySector?: string;
  companySubSector?: string;
  supplierType?: string;
  accountingEmail?: string;
  vatIncluded?: boolean;
  country?: string;
  city?: string;
  notes?: string;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;

export type ClientListResponse = {
  companies: Client[];
  totalCompanies: number;
};
