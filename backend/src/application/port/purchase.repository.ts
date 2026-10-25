import type {
  PurchaseStatus,
  PurchaseWithItems,
} from '../../domain/entities/purchase.entity';

export interface CreatePurchaseItemData {
  productId: string;
  quantityOrdered: number;
  unitCostForeign: string;
  unitCostPen: string;
  unitLandedCost: string;
}

export interface CreatePurchaseData {
  supplierId: string;
  arrivalDate?: Date | null;
  status: PurchaseStatus;
  currency: string;
  exchangeRate: string;
  internationalFreight: string;
  customsDuties: string;
  items: CreatePurchaseItemData[];
}

export interface UpdatePurchaseData {
  id: string;
  supplierId?: string;
  arrivalDate?: Date | null;
  currency?: string;
  exchangeRate?: string;
  internationalFreight?: string;
  customsDuties?: string;
  items?: CreatePurchaseItemData[];
}

export interface ReceiveItemInput {
  productId: string;
  quantityReceived: number;
}

export interface IPurchaseRepository {
  findAll(
    query?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ): Promise<PurchaseWithItems[]>;
  findById(id: string): Promise<PurchaseWithItems | null>;
  create(data: CreatePurchaseData): Promise<string>;
  update(data: UpdatePurchaseData): Promise<void>;
  updateStatus(id: string, status: PurchaseStatus): Promise<void>;
  cancel(id: string): Promise<void>;
  receive(
    id: string,
    receivedItems?: ReceiveItemInput[],
    arrivalDate?: Date | null,
  ): Promise<void>;
}
