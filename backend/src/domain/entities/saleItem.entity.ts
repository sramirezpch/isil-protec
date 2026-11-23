import type { ReservationDiscountType } from './reservationItem.entity';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  discountType: ReservationDiscountType | null;
  discountValue: string | null;
  subtotal: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
