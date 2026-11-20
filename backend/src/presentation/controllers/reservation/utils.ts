import { validate as isValidUuid } from 'uuid';
import type { ReservationDiscountType } from '../../../domain/entities/reservationItem.entity';
import { ReservationInvalidFieldError } from '../../../domain/errors/reservation.errors';

export interface ReservationItemBody {
  productId: string;
  quantity: number | string;
  discountType?: ReservationDiscountType | null;
  discountValue?: string | null;
}

export interface CreateReservationBody {
  clientId?: string;
  dueDate?: string | null;
  items?: ReservationItemBody[];
}

export const validateUuid = (id: unknown, fieldName: string): string => {
  if (typeof id !== 'string' || !isValidUuid(id)) {
    throw new ReservationInvalidFieldError(
      `${fieldName} (debe ser un UUID válido)`,
    );
  }
  return id;
};
