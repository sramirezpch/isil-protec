import type { Franchise } from '../../domain/entities/franchise.entity';

export type UpdateFranchiseData = Partial<
  Pick<Franchise, 'name' | 'active' | 'formatoId'>
>;

export type CreateFranchiseData = {
  name: string;
  active: boolean;
  formatoId: string;
};

// findAll joins formato so the list shows its name
export type FranchiseListItem = {
  id: string;
  name: string;
  active: boolean;
  formatoId: string;
  formatoName: string;
};

export interface IFranchiseRepository {
  findAll(): Promise<FranchiseListItem[]>;
  update(id: string, data: UpdateFranchiseData): Promise<void>;
  create(data: CreateFranchiseData): Promise<void>;
  delete(id: string): Promise<void>;
}
