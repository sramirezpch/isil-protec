import { BrandRepositoryPort } from '../../../application/port/BrandRepositoryPort';

export class BrandRepository implements BrandRepositoryPort {
    async findAll(): Promise<any[]> {
        return [
            { id: '1', name: 'Marca A', active: true },
            { id: '2', name: 'Marca B', active: false }
        ];
    }

    async create(data: { name: string; active: boolean }): Promise<void> {
        console.log('Creating brand:', data);
    }

    async update(id: string, data: { name: string; active: boolean }): Promise<void> {
        console.log(`Updating brand ${id}:`, data);
    }

    async softDelete(id: string): Promise<void> {
        console.log(`Soft deleting brand ${id}`);
    }
}