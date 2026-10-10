import type { Linea } from "../../../domain/entities/linea.entity";
import type { LineaModel } from "../db/schema/linea";

export const toDomain = (row: LineaModel): Linea => ({
  id: row.id,
  name: row.name,
  brandId: row.brandId,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: Linea): LineaModel => ({
  id: domain.id,
  name: domain.name,
  brandId: domain.brandId,
  active: domain.active,
  createdAt: domain.createdAt,
  updatedAt: domain.updatedAt,
  deletedAt: domain.deletedAt,
});
