import type {
  IBrandRepository,
  UpdateBrandData,
} from '../port/brand.repository';

export interface UpdateBrandInput {
  id: string;
  name?: string;
  active?: boolean;
}

export interface CreateBrandInput {
  name: string;
  active: boolean;
}

export class BrandService {
  constructor(private readonly brandRepository: IBrandRepository) { }

  async getAllBrands() {
    return await this.brandRepository.findAll();
  }

  async updateBrand(input: UpdateBrandInput) {
    const { id, ...data } = input;
    return await this.brandRepository.update(id, data);
  }

  async create(input: CreateBrandInput) {
    return await this.brandRepository.create(input);
  }

  async delete(id: string) {
    return await this.brandRepository.delete(id);
  }
}
