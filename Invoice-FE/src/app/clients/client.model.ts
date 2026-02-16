export type Client = {
  _id: string;
  companyId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId?: string;
  notes?: string;
};

export type CreateClientPayload = {
  companyId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId?: string;
  notes?: string;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;

export type ClientListResponse = {
  clients: Client[];
  totalClients: number;
};
