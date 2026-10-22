import type { PurchaseItem } from './purchaseItem.entity';

export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface Purchase {
  id: string;
  supplierId: string;
  arrivalDate: Date | null;
  status: PurchaseStatus;
  currency: string;
  exchangeRate: string;
  internationalFreight: string;
  customsDuties: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PurchaseItemWithProduct extends PurchaseItem {
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface PurchaseWithItems extends Purchase {
  supplier?: {
    id: string;
    companyName: string;
  };
  items: PurchaseItemWithProduct[];
}
