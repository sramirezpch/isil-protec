import type { Franchise } from '../../../domain/entities/franchise.entity';
import type { FranchiseModel } from '../db/schema/franchise';

export const toDomain = (row: FranchiseModel): Franchise => ({
  id: row.id,
  name: row.name,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: Franchise): FranchiseModel => ({
  id: domain.id,
  active: domain.active,
  createdAt: domain.createdAt,
  deletedAt: domain.deletedAt,
  name: domain.name,
  updatedAt: domain.updatedAt,
});