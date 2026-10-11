import { eq } from 'drizzle-orm';
import type {
  CreateLineaInput,
  ILineaRepository,
  LineaListItem,
  UpdateLineaData,
} from '../../../application/port/linea.repository';
import { db } from '../db/connection';
import { brandTable } from '../db/schema/brand';
import { lineaTable } from '../db/schema/linea';
import { Linea } from '../../../domain/entities/linea.entity';
import { toDomain } from '../mappers/linea.mapper';

export class LineaRepository implements ILineaRepository {
  async findAll(): Promise<LineaListItem[]> {
    return db
      .select({
        id: lineaTable.id,
        name: lineaTable.name,
        brandName: brandTable.name,
        active: lineaTable.active,
      })
      .from(lineaTable)
      .innerJoin(brandTable, eq(lineaTable.brandId, brandTable.id));
  }

  async create(data: CreateLineaInput): Promise<void> {
    await db.insert(lineaTable).values(data);
  }

  async update(id: string, data: UpdateLineaData): Promise<void> {
    await db.update(lineaTable).set(data).where(eq(lineaTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db
      .update(lineaTable)
      .set({ active: false })
      .where(eq(lineaTable.id, id));
  }

  async findById(id: string): Promise<Linea> {
    const [linea] = await db
      .select()
      .from(lineaTable)
      .where(eq(lineaTable.id, id));

    return toDomain(linea);
  }
}
