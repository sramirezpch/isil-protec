import { BrandRepositoryPort } from '../port/BrandRepositoryPort';

export class BrandService {
    constructor(private readonly brandRepository: BrandRepositoryPort) {}

    async getAllBrands() {
        return await this.brandRepository.findAll();
    }
    async createBrand(data: { name: string; active: boolean }) {
        return await this.brandRepository.create(data);
    }
    async updateBrand(id: string, data: { name: string; active: boolean }) {
        return await this.brandRepository.update(id, data);
    }
    async softDeleteBrand(id: string) {
        return await this.brandRepository.softDelete(id);
    }
}