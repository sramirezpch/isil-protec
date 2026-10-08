import type { Formato } from '../../../domain/entities/formato.entity';
import type { FormatoModel } from '../db/schema/formato';

export const toDomain = (row: FormatoModel): Formato => ({
  id: row.id,
  name: row.name,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: Formato): FormatoModel => ({
  id: domain.id,
  active: domain.active,
  createdAt: domain.createdAt,
  deletedAt: domain.deletedAt,
  name: domain.name,
  updatedAt: domain.updatedAt,
});
