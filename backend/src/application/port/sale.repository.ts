import type { SaleStatus, SaleWithItems } from '../../domain/entities/sale.entity';

export interface CreateSaleItemData {
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface CreateSaleData {
  clientId: string;
  totalAmount: string;
  saleDate: Date;
  items: CreateSaleItemData[];
}

export interface ISaleRepository {
  findAll(
    query?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ): Promise<SaleWithItems[]>;
  findById(id: string): Promise<SaleWithItems | null>;
  create(data: CreateSaleData): Promise<string>;
  update(id: string, data: CreateSaleData): Promise<void>;
  updateStatus(id: string, status: SaleStatus): Promise<void>;
  cancel(id: string): Promise<void>;
}
