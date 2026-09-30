import 'dotenv/config';
import { formatoTable } from '../db/schema/formato';
import { db } from '../db/connection';

export class FormatoRepository {
  async getAllFormatos() {
    const formatos = await db.select().from(formatoTable);
    return formatos;
  }
}