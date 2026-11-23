import {
  ReservationAlreadyCancelledError,
  ReservationCancellationConfirmationRequiredError,
  ReservationCancellationReasonInvalidError,
  ReservationCannotBeCancelledError,
} from '../errors/reservation.errors';
import type { ReservationItem } from './reservationItem.entity';
import { formatMoneyCents, parseMoneyCents } from './reservationPayment.entity';

export type ReservationStatus = 'VIGENTE' | 'CANCELADA';
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
  if (status !== 'VIGENTE') {
    throw new ReservationCannotBeCancelledError();
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
