export type CreateSupplierBody = {
  companyName: string;
  country: string;
  taxId: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
};

export type UpdateSupplierParams = { id: string };

export type UpdateSupplierBody = Partial<{
  companyName: string;
  country: string;
  taxId: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  active: boolean;
}>;