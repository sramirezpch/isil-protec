import type {
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
    console.log(`Updating brand ${id}`, data);
  }
}
