import type { Supplier } from '../../../domain/entities/supplier.entity';
import type { SupplierModel } from '../db/schema/supplier';

export const toPersistence = (domain: Supplier): SupplierModel => ({
  id: domain.id,
  companyName: domain.companyName,
  country: domain.country,
  taxId: domain.taxId,
  address: domain.address,
  contactName: domain.contactName,
  email: domain.email,
  phone: domain.phone,
  active: domain.active,
  createdAt: domain.createdAt,
  updatedAt: domain.updatedAt,
  deletedAt: domain.deletedAt,
});

export const toDomain = (row: SupplierModel): Supplier => ({
  id: row.id,
  companyName: row.companyName,
  country: row.country,
  taxId: row.taxId,
  address: row.address,
  contactName: row.contactName,
  email: row.email,
  phone: row.phone,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});
