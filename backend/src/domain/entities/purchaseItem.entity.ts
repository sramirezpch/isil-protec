export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number | null;
  unitCostForeign: string;
  unitCostPen: string;
  unitLandedCost: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
