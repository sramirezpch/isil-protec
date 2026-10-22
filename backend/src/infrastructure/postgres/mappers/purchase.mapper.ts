import type {
  Purchase,
  PurchaseStatus,
} from '../../../domain/entities/purchase.entity';
import type { PurchaseItem } from '../../../domain/entities/purchaseItem.entity';
import type { PurchaseModel } from '../db/schema/purchase';
import type { PurchaseItemModel } from '../db/schema/purchaseItem';

export const toPurchaseDomain = (row: PurchaseModel): Purchase => ({
  id: row.id,
  supplierId: row.supplierId,
  arrivalDate: row.arrivalDate,
  status: row.status as PurchaseStatus,
  currency: row.currency,
  exchangeRate: row.exchangeRate,
  internationalFreight: row.internationalFreight,
  customsDuties: row.customsDuties,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPurchaseItemDomain = (row: PurchaseItemModel): PurchaseItem => ({
  id: row.id,
  purchaseId: row.purchaseId,
  productId: row.productId,
  quantityOrdered: row.quantityOrdered,
  quantityReceived: row.quantityReceived,
  unitCostForeign: row.unitCostForeign,
  unitCostPen: row.unitCostPen,
  unitLandedCost: row.unitLandedCost,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});
