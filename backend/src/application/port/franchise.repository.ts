import type { Franchise } from '../../domain/entities/franchise.entity';

export type UpdateFranchiseData = Partial<Pick<Franchise, 'name' | 'active'>>;

export type CreateFranchiseData = {
  name: string;
  active: boolean;
}

export interface IFranchiseRepository {
  findAll(): Promise<Franchise[]>;
  update(id: string, data: UpdateFranchiseData): Promise<void>;
  create(data: CreateFranchiseData): Promise<void>;
  delete(id: string): Promise<void>;
}