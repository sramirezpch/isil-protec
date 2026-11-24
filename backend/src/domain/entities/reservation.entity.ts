import {
  ReservationAlreadyCancelledError,
  ReservationAlreadyConvertedError,
  ReservationCancellationConfirmationRequiredError,
  ReservationCancellationReasonInvalidError,
  ReservationCannotBeCancelledError,
  ReservationCannotBeConvertedError,
  ReservationConversionStockInsufficientError,
  ReservationConvertedCannotBeCancelledError,
} from '../errors/reservation.errors';
import type { ReservationItem } from './reservationItem.entity';
import { formatMoneyCents, parseMoneyCents } from './reservationPayment.entity';
import type { SaleStatus } from './sale.entity';

export type ReservationStatus = 'VIGENTE' | 'CANCELADA' | 'CONVERTIDA';
export type ReservationType = 'RESERVA' | 'PREVENTA';

export interface Reservation {
  id: string;
  clientId: string;
  dueDate: string;
  status: ReservationStatus;
  totalAmount: string;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ReservationWithItems extends Reservation {
  type: ReservationType;
  client?: {
    id: string;
    name: string | null;
    lastName: string | null;
    phone: string;
  };
  sale?: {
    id: string;
    status: SaleStatus;
  };
  items: ReservationItemWithProduct[];
}

export interface ReservationWithPaymentTotal extends ReservationWithItems {
  totalPaid: string;
}

export interface ReservationWithPaymentSummary
  extends ReservationWithPaymentTotal {
  pendingBalance: string;
}

export function normalizeCancellationReason(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ReservationCancellationReasonInvalidError();
  }
  const reason = value.trim();
  if (!reason || reason.length > 500) {
    throw new ReservationCancellationReasonInvalidError();
  }
  return reason;
}

export function validateReservationCancellationState(
  status: ReservationStatus,
): void {
  if (status === 'CANCELADA') {
    throw new ReservationAlreadyCancelledError();
  }
  if (status === 'CONVERTIDA') {
    throw new ReservationConvertedCannotBeCancelledError();
  }
  if (status !== 'VIGENTE') {
    throw new ReservationCannotBeCancelledError();
  }
}

export function validateReservationConversionState(
  status: ReservationStatus,
): void {
  if (status === 'CANCELADA') {
    throw new ReservationCannotBeConvertedError();
  }
  if (status === 'CONVERTIDA') {
    throw new ReservationAlreadyConvertedError();
  }
}

export function validateReservationConversionStock(
  figureName: string,
  available: number,
  requested: number,
): void {
  if (available < requested) {
    throw new ReservationConversionStockInsufficientError(
      figureName,
      available,
      requested,
    );
  }
}

export function validateCancellationPaymentConfirmation(
  totalPaid: string,
  confirmed: boolean,
): void {
  const paidCents = parseMoneyCents(totalPaid, 'totalPaid');
  if (paidCents > 0n && !confirmed) {
    throw new ReservationCancellationConfirmationRequiredError(
      formatMoneyCents(paidCents),
    );
  }
}

export interface ReservationItemWithProduct extends ReservationItem {
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}
