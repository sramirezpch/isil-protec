import type { Brand } from '../../domain/entities/brand.entity';

export type UpdateBrandData = Partial<Pick<Brand, 'name' | 'active'>>;

export interface IBrandRepository {
  findAll(): Promise<Brand[]>;
  update(id: string, data: UpdateBrandData): Promise<void>;
}
