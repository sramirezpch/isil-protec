import { Supplier } from "../../domain/entities/supplier.entity";

export interface CreateSupplierInput {
  companyName: string;
  country: string;
  taxId: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
}

export type UpdateSupplierInput = { id: string } & Omit<
  Partial<Supplier>,
  "createdAt" | "updatedAt" | "deletedAt"
>;

export interface ISupplierRepository {
  findAll(query?: string): Promise<Supplier[]>;
  update(input: UpdateSupplierInput): Promise<void>;
  create(input: CreateSupplierInput): Promise<void>;
  delete(id: string): Promise<void>;
}