export interface BrandRepositoryPort {
    findAll(): Promise<any[]>;
    update(id: string, data: { name: string; active: boolean }): Promise<void>;
}