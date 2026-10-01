import type { Brand } from '../../../domain/entities/brand.entity';
import type { BrandModel } from '../db/schema/brand';

export const toDomain = (row: BrandModel): Brand => ({
  id: row.id,
  name: row.name,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: Brand): BrandModel => ({
  id: domain.id,
  active: domain.active,
  createdAt: domain.createdAt,
  deletedAt: domain.deletedAt,
  name: domain.name,
  updatedAt: domain.updatedAt,
});
