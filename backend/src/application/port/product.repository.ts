import type { Product } from '../../domain/entities/product.entity';

export interface CreateProductInput {
  sku: string;
  name: string;
  price: string;
  stock: number;
  franchiseId: string;
  lineaId: string;
}

export type UpdateProductInput = { id: string } & Omit<
  Partial<Product>,
  'createdAt' | 'updatedAt' | 'deletedAt'
>;

export interface IProductRepository {
  findAll(query?: string): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findActiveIds(ids: string[]): Promise<Set<string>>;
  update(input: UpdateProductInput): Promise<void>;
  create(input: CreateProductInput): Promise<void>;
  delete(id: string): Promise<void>;
}
