export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
