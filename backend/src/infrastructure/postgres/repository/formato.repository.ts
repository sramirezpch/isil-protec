import { sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type { AddFormatoInput, IFormatoRepository, UpdateFormatoInput } from '../../../application/port/formato.repository';
import type { Formato } from '../../../domain/entities/formato.entity';
import { FormatoNameAlreadyExistsError, FormatoNotFoundError, FormatoUpdateError } from '../../../domain/errors/formato.errors';
import { db } from '../db/connection';
import { formatoTable } from '../db/schema/formato';
import { toDomain } from '../mappers/formato.mapper';

export class FormatoRepository implements IFormatoRepository {

  async getAllFormatos() {
    const formatos = await db.select().from(formatoTable);

    return formatos.map(toDomain);
  }

  async addFormato({ name, active }: AddFormatoInput): Promise<Formato> {
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
        .values({ name, active })
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

  async updateFormato({ id, name, active }: UpdateFormatoInput): Promise<Formato> {
    if (name !== undefined) {
      const [existingFormato] = await db
        .select({ id: formatoTable.id })
        .from(formatoTable)
        .where(sql`lower(trim(${formatoTable.name})) = lower(trim(${name})) AND ${formatoTable.id} != ${id}`);

      if (existingFormato) {
        throw new FormatoNameAlreadyExistsError();
      }
    }

    const updates: { name?: string; active?: boolean } = {};
    if (name !== undefined) updates.name = name;
    if (active !== undefined) updates.active = active;

    let formato: typeof formatoTable.$inferSelect | undefined;
    try {
      [formato] = await db
        .update(formatoTable)
        .set(updates)
        .where(sql`${formatoTable.id} = ${id}`)
        .returning();
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.code === '23505' &&
        error.constraint === 'formato_name_normalized_unique'
      ) {
        throw new FormatoNameAlreadyExistsError();
      }

      throw new FormatoUpdateError();
    }

    if (!formato) {
      throw new FormatoNotFoundError();
    }

    return toDomain(formato);
  }
}