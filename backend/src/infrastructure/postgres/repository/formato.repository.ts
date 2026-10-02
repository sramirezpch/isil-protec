import { sql } from 'drizzle-orm';
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
      .where(sql`lower(trim(${formatoTable.name})) = lower(trim(${name}))`)
      .limit(1);

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
      if (isFormatoNameUniqueViolation(error)) {
        throw new FormatoNameAlreadyExistsError();
      }

      throw error;
    }
  }
}

const isFormatoNameUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === '23505' &&
  'constraint' in error &&
  error.constraint === 'formato_name_normalized_unique';
