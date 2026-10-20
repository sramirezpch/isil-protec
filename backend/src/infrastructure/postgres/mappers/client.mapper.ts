import type { Client } from '../../../domain/entities/client.entity';
import type { ClientModel } from '../db/schema/client';

export const toDomain = (row: ClientModel): Client => ({
  id: row.id,
  phone: row.phone,
  name: row.name,
  lastName: row.lastName,
  aliasTiktok: row.aliasTiktok,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: Client): ClientModel => ({
  id: domain.id,
  phone: domain.phone,
  name: domain.name ?? null,
  lastName: domain.lastName ?? null,
  aliasTiktok: domain.aliasTiktok ?? null,
  active: domain.active,
  createdAt: domain.createdAt,
  updatedAt: domain.updatedAt,
  deletedAt: domain.deletedAt,
});