import { eq, ilike, or } from 'drizzle-orm';
import type {
  CreateSupplierInput,
  ISupplierRepository,
  UpdateSupplierInput,
} from '../../../application/port/supplier.repository';
import type { Supplier } from '../../../domain/entities/supplier.entity';
import { db } from '../db/connection';
import { supplierTable } from '../db/schema/supplier';
import { toDomain } from '../mappers/supplier.mapper';

export class SupplierRepository implements ISupplierRepository {
  async findAll(query?: string): Promise<Supplier[]> {
    const suppliers = await db
      .select()
      .from(supplierTable)
      .where(
        query
          ? or(
              ilike(supplierTable.companyName, `%${query}%`),
              ilike(supplierTable.contactName, `%${query}%`),
            )
          : undefined,
      );

    return suppliers.map(toDomain);
  }

  async findById(id: string): Promise<Supplier | null> {
    const [supplier] = await db
      .select()
      .from(supplierTable)
      .where(eq(supplierTable.id, id))
      .limit(1);

    return supplier ? toDomain(supplier) : null;
  }

  async create(input: CreateSupplierInput): Promise<void> {
    await db.insert(supplierTable).values(input);
  }

  async update(input: UpdateSupplierInput): Promise<void> {
    const { id, ...rest } = input;
    await db.update(supplierTable).set(rest).where(eq(supplierTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db
      .update(supplierTable)
      .set({ active: false })
      .where(eq(supplierTable.id, id));
  }
}
