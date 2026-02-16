export type Supplier = {
  _id: string;
  companyId: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  taxId?: string;
  notes?: string;
};

export type CreateSupplierPayload = {
  companyId: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  taxId?: string;
  notes?: string;
};

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export type SupplierListResponse = {
  suppliers: Supplier[];
  totalSuppliers: number;
};
