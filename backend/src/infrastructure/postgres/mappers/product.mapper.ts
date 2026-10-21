import type { Product } from '../../../domain/entities/product.entity';
import type { ProductModel } from '../db/schema/product';

export const toPersistence = (domain: Product): ProductModel => ({
  id: domain.id,
  name: domain.name,
  sku: domain.sku,
  price: domain.price,
  stock: domain.stock,
  active: domain.active,
  franchiseId: domain.franchiseId,
  lineaId: domain.lineaId,
  createdAt: domain.createdAt,
  updatedAt: domain.updatedAt,
  deletedAt: domain.deletedAt,
});

export const toDomain = (row: ProductModel): Product => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  price: row.price,
  stock: row.stock,
  active: row.active,
  franchiseId: row.franchiseId,
  lineaId: row.lineaId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});
