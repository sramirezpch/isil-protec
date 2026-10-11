import { Product } from '../../domain/entities/product.entity';

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
  findAll(): Promise<Product[]>;
  update(input: UpdateProductInput): Promise<void>;
  create(input: CreateProductInput): Promise<void>;
  delete(id: string): Promise<void>;
}
