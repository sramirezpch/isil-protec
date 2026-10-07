import type { Brand } from '../../domain/entities/brand.entity';

export type UpdateBrandData = Partial<Pick<Brand, 'name' | 'active'>>;

export type CreateBrandData = {
  name: string;
  active: boolean;
}

export interface IBrandRepository {
  findAll(): Promise<Brand[]>;
  update(id: string, data: UpdateBrandData): Promise<void>;
  create(data: CreateBrandData): Promise<void>;
  delete(id: string): Promise<void>;
}
