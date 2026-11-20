export type ReservationDiscountType = 'PORCENTAJE' | 'MONTO';

export interface ReservationItem {
  id: string;
  reservationId: string;
  productId: string;
  quantity: number;
  cantidadBloqueada: number;
  unitPrice: string;
  discountType: ReservationDiscountType | null;
  discountValue: string | null;
  lineTotal: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
