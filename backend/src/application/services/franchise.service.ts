import type {
  IFranchiseRepository,
} from '../port/franchise.repository';

export interface UpdateFranchiseInput {
  id: string;
  name?: string;
  active?: boolean;
}

export interface CreateFranchiseInput {
  name: string;
  active: boolean;
}

export class FranchiseService {
  constructor(private readonly franchiseRepository: IFranchiseRepository) { }

  async getAllFranchises() {
    return await this.franchiseRepository.findAll();
  }

  async updateFranchise(input: UpdateFranchiseInput) {
    const { id, ...data } = input;
    return await this.franchiseRepository.update(id, data);
  }

  async create(input: CreateFranchiseInput) {
    return await this.franchiseRepository.create(input);
  }

  async delete(id: string) {
    return await this.franchiseRepository.delete(id);
  }
}