import { eq } from 'drizzle-orm';
import type {
  CreateFranchiseData,
  IFranchiseRepository,
  UpdateFranchiseData,
} from '../../../application/port/franchise.repository';
import type { Franchise } from '../../../domain/entities/franchise.entity';
import { db } from '../db/connection';
import { franchiseTable } from '../db/schema/franchise';
import { toDomain } from '../mappers/franchise.mapper';

export class FranchiseRepository implements IFranchiseRepository {
  async findAll(): Promise<Franchise[]> {
    const franchises = await db.select().from(franchiseTable);

    return franchises.map(toDomain);
  }

  async update(id: string, data: UpdateFranchiseData): Promise<void> {
    await db.update(franchiseTable).set(data).where(eq(franchiseTable.id, id));
  }

  async create(data: CreateFranchiseData): Promise<void> {
    await db.insert(franchiseTable).values(data);
  }

  async delete(id: string): Promise<void> {
    await db.update(franchiseTable).set({ active: false }).where(eq(franchiseTable.id, id));
  }
}