export interface Supplier {
  id: string;
  companyName: string;
  country: string;
  taxId: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
