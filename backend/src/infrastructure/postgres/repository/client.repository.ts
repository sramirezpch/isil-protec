import { eq, or, ilike } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type {
  CreateClientData,
  IClientRepository,
  UpdateClientData,
} from '../../../application/port/client.repository';
import type { Client } from '../../../domain/entities/client.entity';
import { db } from '../db/connection';
import { clientTable } from '../db/schema/client';
import { toDomain } from '../mappers/client.mapper';

export class ClientRepository implements IClientRepository {
  async findAll(query?: string): Promise<Client[]> {
    let clients;
    if (query) {
      clients = await db.select().from(clientTable).where(
        or(
          ilike(clientTable.aliasTiktok, `%${query}%`),
          ilike(clientTable.name, `%${query}%`),
          ilike(clientTable.phone, `%${query}%`)
        )
      );
    } else {
      clients = await db.select().from(clientTable);
    }
    return clients.map(toDomain);
  }

  async update(id: string, data: UpdateClientData): Promise<void> {
    await db.update(clientTable).set(data).where(eq(clientTable.id, id));
  }

  async create(data: CreateClientData): Promise<void> {
    try {
      await db.insert(clientTable).values(data);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throw new Error('El teléfono ya está registrado');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await db.update(clientTable).set({ active: false }).where(eq(clientTable.id, id));
  }
}