import { eq } from 'drizzle-orm';
import type {
  CreateBrandData,
  IBrandRepository,
  UpdateBrandData,
} from '../../../application/port/brand.repository';
import type { Brand } from '../../../domain/entities/brand.entity';
import { db } from '../db/connection';
import { brandTable } from '../db/schema/brand';
import { toDomain } from '../mappers/brand.mapper';

export class BrandRepository implements IBrandRepository {
  async findAll(): Promise<Brand[]> {
    const brands = await db.select().from(brandTable);

    return brands.map(toDomain);
  }

  async update(id: string, data: UpdateBrandData): Promise<void> {
    await db.update(brandTable).set(data).where(eq(brandTable.id, id));
  }

  async create(data: CreateBrandData): Promise<void> {
    await db.insert(brandTable).values(data);
  }

  async delete(id: string): Promise<void> {
    await db.update(brandTable).set({ active: false }).where(eq(brandTable.id, id));
  }
}
