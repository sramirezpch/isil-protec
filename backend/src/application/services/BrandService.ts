import { BrandRepositoryPort } from '../port/BrandRepositoryPort';

export class BrandService {
    constructor(private readonly brandRepository: BrandRepositoryPort) {}

    async getAllBrands() {
        return await this.brandRepository.findAll();
    }

    async updateBrand(id: string, data: { name: string; active: boolean }) {
        return await this.brandRepository.update(id, data);
    }
}