import type { ISupplierRepository } from '../port/supplier.repository';

export interface CreateSupplierInput {
  companyName: string;
  country: string;
  taxId: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface UpdateSupplierInput
  extends Partial<{
    companyName: string;
    country: string;
    taxId: string;
    address: string;
    contactName: string;
    email: string;
    phone: string;
    active: boolean;
  }> {
  id: string;
}

export class SupplierService {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async findAll(query?: string) {
    return await this.supplierRepository.findAll(query);
  }

  async create(input: CreateSupplierInput) {
    return await this.supplierRepository.create(input);
  }

  async update(input: UpdateSupplierInput) {
    return await this.supplierRepository.update(input);
  }

  async delete(id: string) {
    return await this.supplierRepository.delete(id);
  }
}