import { eq } from 'drizzle-orm';
import type {
  CreateFranchiseData,
  FranchiseListItem,
  IFranchiseRepository,
  UpdateFranchiseData,
} from '../../../application/port/franchise.repository';
import { db } from '../db/connection';
import { formatoTable } from '../db/schema/formato';
import { franchiseTable } from '../db/schema/franchise';
import { Franchise } from '../../../domain/entities/franchise.entity';
import { toDomain } from '../mappers/franchise.mapper';

export class FranchiseRepository implements IFranchiseRepository {
  async findAll(): Promise<FranchiseListItem[]> {
    return db
      .select({
        id: franchiseTable.id,
        name: franchiseTable.name,
        active: franchiseTable.active,
        formatoId: franchiseTable.formatoId,
        formatoName: formatoTable.name,
      })
      .from(franchiseTable)
      .innerJoin(formatoTable, eq(franchiseTable.formatoId, formatoTable.id));
  }

  async update(id: string, data: UpdateFranchiseData): Promise<void> {
    await db.update(franchiseTable).set(data).where(eq(franchiseTable.id, id));
  }

  async create(data: CreateFranchiseData): Promise<void> {
    await db.insert(franchiseTable).values(data);
  }

  async delete(id: string): Promise<void> {
    await db
      .update(franchiseTable)
      .set({ active: false })
      .where(eq(franchiseTable.id, id));
  }

  async findById(id: string): Promise<Franchise> {
    const [franchise] = await db
      .select()
      .from(franchiseTable)
      .where(eq(franchiseTable.id, id));

    return toDomain(franchise);
  }
}
