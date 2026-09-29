import 'dotenv/config';
import { formatoTable } from '../db/schema/formato';
import { db } from '../db/connection';

export const formatoRepository = {
  async listAllFormatos() {
    const formatos = await db.select().from(formatoTable);
    return formatos;
  }
}