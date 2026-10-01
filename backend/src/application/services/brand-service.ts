import type {
  IBrandRepository,
  UpdateBrandData,
} from '../port/brand.repository';

export interface UpdateBrandInput extends UpdateBrandData {
  id: string;
}

export class BrandService {
  constructor(private readonly brandRepository: IBrandRepository) {}

  async getAllBrands() {
    return await this.brandRepository.findAll();
  }

  async updateBrand(input: UpdateBrandInput) {
    const { id, ...data } = input;
    return await this.brandRepository.update(id, data);
  }
}
