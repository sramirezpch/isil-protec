import type { SaleItem } from './saleItem.entity';

export type SaleStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Sale {
  id: string;
  clientId: string;
  totalAmount: string;
  saleDate: Date;
  status: SaleStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SaleItemWithProduct extends SaleItem {
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface SaleWithItems extends Sale {
  client?: {
    id: string;
    name: string | null;
    lastName: string | null;
    phone: string;
  };
  items: SaleItemWithProduct[];
}
