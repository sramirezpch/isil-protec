export interface BrandRepositoryPort {
    findAll(): Promise<any[]>;
    create(data: { name: string; active: boolean }): Promise<void>;
    update(id: string, data: { name: string; active: boolean }): Promise<void>;
    softDelete(id: string): Promise<void>;
}