import { eq, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type { AddFormatoInput, IFormatoRepository, UpdateFormatoData } from '../../../application/port/formato.repository';
import type { Formato } from '../../../domain/entities/formato.entity';
import { FormatoNameAlreadyExistsError, FormatoNotFoundError, FormatoUpdateError } from '../../../domain/errors/formato.errors';
import { db } from '../db/connection';
import { formatoTable } from '../db/schema/formato';
import { toDomain } from '../mappers/formato.mapper';

export class FormatoRepository implements IFormatoRepository {

  async findAll() {
    const formatos = await db.select().from(formatoTable);

    return formatos.map(toDomain);
  }

  async create(data: AddFormatoInput): Promise<void> {
    await db.insert(formatoTable).values(data);
  }

  async update(id: string, data: UpdateFormatoData): Promise<void> {
    await db.update(formatoTable).set(data).where(eq(formatoTable.id, id));
  }
}