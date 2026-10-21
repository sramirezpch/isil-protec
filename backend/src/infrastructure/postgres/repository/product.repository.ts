import { eq, ilike, or } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type {
  CreateProductInput,
  IProductRepository,
  UpdateProductInput,
} from '../../../application/port/product.repository';
import type { Product } from '../../../domain/entities/product.entity';
import { ProductSkuAlreadyExistsError } from '../../../domain/errors/product.errors';
import { db } from '../db/connection';
import { productTable } from '../db/schema/product';
import { toDomain } from '../mappers/product.mapper';

const UNIQUE_VIOLATION = '23505';
const SKU_UNIQUE_CONSTRAINT = 'product_sku_unique';

// Drizzle wraps the pg error in `cause`, so check both levels
const isDuplicateSku = (error: unknown): boolean => {
  const pgError =
    error instanceof DatabaseError ? error : (error as Error)?.cause;
  return (
    pgError instanceof DatabaseError &&
    pgError.code === UNIQUE_VIOLATION &&
    pgError.constraint === SKU_UNIQUE_CONSTRAINT
  );
};

export class ProductRepository implements IProductRepository {
  async create(input: CreateProductInput): Promise<void> {
    try {
      await db.insert(productTable).values(input);
    } catch (error) {
      if (isDuplicateSku(error)) throw new ProductSkuAlreadyExistsError();
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await db
      .update(productTable)
      .set({ active: false })
      .where(eq(productTable.id, id));
  }
  async findAll(query?: string): Promise<Product[]> {
    const products = await db
      .select()
      .from(productTable)
      .where(
        query
          ? or(
              ilike(productTable.sku, `%${query}%`),
              ilike(productTable.name, `%${query}%`),
            )
          : undefined,
      );

    return products.map(toDomain);
  }
  async update(input: UpdateProductInput): Promise<void> {
    const { id, ...rest } = input;
    try {
      await db.update(productTable).set(rest).where(eq(productTable.id, id));
    } catch (error) {
      if (isDuplicateSku(error)) throw new ProductSkuAlreadyExistsError();
      throw error;
    }
  }
}
