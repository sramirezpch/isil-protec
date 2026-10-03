import { sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type { IFormatoRepository } from '../../../application/port/formato.repository';
import type { Formato } from '../../../domain/entities/formato.entity';
import { FormatoNameAlreadyExistsError } from '../../../domain/errors/formato.errors';
import { db } from '../db/connection';
import { formatoTable } from '../db/schema/formato';
import { toDomain } from '../mappers/formato.mapper';

export class FormatoRepository implements IFormatoRepository {
  async getAllFormatos() {
    const formatos = await db.select().from(formatoTable);

    return formatos.map(toDomain);
  }

  async addFormato(name: string): Promise<Formato> {
    const [existingFormato] = await db
      .select({ id: formatoTable.id })
      .from(formatoTable)
      .where(sql`lower(trim(${formatoTable.name})) = lower(trim(${name}))`);

    if (existingFormato) {
      throw new FormatoNameAlreadyExistsError();
    }

    try {
      const [formato] = await db
        .insert(formatoTable)
        .values({ name })
        .returning();

      return toDomain(formato);
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.code === '23505' &&
        error.constraint === 'formato_name_normalized_unique'
      ) {
        throw new FormatoNameAlreadyExistsError();
      }

      throw error;
    }
  }
}