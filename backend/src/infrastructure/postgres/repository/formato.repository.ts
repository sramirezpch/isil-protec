import type { IFormatoRepository } from '../../../application/port/formato.repository';
import { db } from '../db/connection';
import { formatoTable } from '../db/schema/formato';
import { toDomain } from '../mappers/formato.mapper';

export class FormatoRepository implements IFormatoRepository {
  async getAllFormatos() {
    const formatos = await db.select().from(formatoTable);

    return formatos.map(toDomain);
  }
}
