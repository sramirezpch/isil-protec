import type { IClientRepository } from '../port/client.repository';

export interface UpdateClientInput {
  id: string;
  phone?: string;
  name?: string;
  lastName?: string;
  aliasTiktok?: string;
  active?: boolean;
}

export interface CreateClientInput {
  phone: string;
  name?: string;
  lastName?: string;
  aliasTiktok?: string;
  active?: boolean;
}

export class ClientService {
  constructor(private readonly clientRepository: IClientRepository) {}

  async getAllClients(query?: string) {
    return await this.clientRepository.findAll(query);
  }

  async updateClient(input: UpdateClientInput) {
    const { id, ...data } = input;
    return await this.clientRepository.update(id, data);
  }

  async create(input: CreateClientInput) {
    return await this.clientRepository.create(input);
  }

  async delete(id: string) {
    return await this.clientRepository.delete(id);
  }
}