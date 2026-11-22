import type { ReservationWithItems } from '../../../domain/entities/reservation.entity';
import type { ReservationItem } from '../../../domain/entities/reservationItem.entity';
import type { ReservationModel } from '../db/schema/reservation';
import type { ReservationItemModel } from '../db/schema/reservationItem';

export const toReservationDomain = (
  row: ReservationModel,
): Omit<ReservationWithItems, 'type' | 'items' | 'client'> => ({
  id: row.id,
  clientId: row.clientId,
  dueDate: row.dueDate,
  status: row.status,
  totalAmount: row.totalAmount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toReservationItemDomain = (
  row: ReservationItemModel,
): ReservationItem => ({
  id: row.id,
  reservationId: row.reservationId,
  productId: row.productId,
  quantity: row.quantity,
  cantidadBloqueada: row.cantidadBloqueada,
  unitPrice: row.unitPrice,
  discountType: row.discountType,
  discountValue: row.discountValue,
  lineTotal: row.lineTotal,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});
