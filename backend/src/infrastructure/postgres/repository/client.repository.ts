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

const UNIQUE_VIOLATION = '23505';
const PHONE_UNIQUE_CONSTRAINT = 'client_phone_unique';

// Drizzle wraps the pg error in `cause`, so check both levels
const isDuplicatePhone = (error: unknown): boolean => {
  const pgError =
    error instanceof DatabaseError ? error : (error as Error)?.cause;
  return (
    pgError instanceof DatabaseError &&
    pgError.code === UNIQUE_VIOLATION &&
    pgError.constraint === PHONE_UNIQUE_CONSTRAINT
  );
};

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

  async findById(id: string): Promise<Client | null> {
    const [row] = await db
      .select()
      .from(clientTable)
      .where(eq(clientTable.id, id))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async update(id: string, data: UpdateClientData): Promise<void> {
    try {
      await db.update(clientTable).set(data).where(eq(clientTable.id, id));
    } catch (error) {
      if (isDuplicatePhone(error)) {
        throw new Error('El teléfono ya está registrado');
      }
      throw error;
    }
  }

  async create(data: CreateClientData): Promise<void> {
    try {
      await db.insert(clientTable).values(data);
    } catch (error) {
      if (isDuplicatePhone(error)) {
        throw new Error('El teléfono ya está registrado');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await db.update(clientTable).set({ active: false }).where(eq(clientTable.id, id));
  }
}
