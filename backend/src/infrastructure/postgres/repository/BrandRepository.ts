import { BrandRepositoryPort } from '../../application/port/BrandRepositoryPort';

export class BrandRepository implements BrandRepositoryPort {
    async findAll(): Promise<any[]> {
        return [
            { id: '1', name: 'Marca A', active: true },
            { id: '2', name: 'Marca B', active: false }
        ];
    }
    async update(id: string, data: { name: string; active: boolean }): Promise<void> {
        console.log(`Updating brand ${id}`, data);
    }
}