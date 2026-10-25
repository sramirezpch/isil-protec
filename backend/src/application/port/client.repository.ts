import type { Client } from '../../domain/entities/client.entity';

export type UpdateClientData = Partial<Pick<Client, 'name' | 'lastName' | 'phone' | 'aliasTiktok' | 'active'>>;

export type CreateClientData = {
  phone: string;
  name?: string;
  lastName?: string;
  aliasTiktok?: string;
  active?: boolean;
};

export interface IClientRepository {
  findAll(query?: string): Promise<Client[]>;
  findById(id: string): Promise<Client | null>;
  update(id: string, data: UpdateClientData): Promise<void>;
  create(data: CreateClientData): Promise<void>;
  delete(id: string): Promise<void>;
}
