import {
  AbonoExcedeSaldoError,
  ReservationInvalidFieldError,
  ReservationPaymentAmountInvalidError,
  ReservationPaymentBalanceInvalidError,
  ReservationPaymentMethodRequiredError,
} from '../errors/reservation.errors';
import type { ReservationStatus } from './reservation.entity';

export const RESERVATION_PAYMENT_METHODS = [
  'YAPE',
  'PLIN',
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA',
] as const;
export const MAX_NUMERIC_CENTS = 999_999_999_999n;

export type ReservationPaymentMethod =
  (typeof RESERVATION_PAYMENT_METHODS)[number];

export interface ReservationPayment {
  id: string;
  reservationId: string;
  amount: string;
  paymentMethod: ReservationPaymentMethod;
  recordedAt: Date;
}

export interface ReservationPaymentBalance {
  status: ReservationStatus;
  totalAmount: string;
  totalPaid: string;
}

export interface ReservationPaymentSummary {
  totalAmount: string;
  totalPaid: string;
  pendingBalance: string;
}

export interface ReservationPaymentHistory extends ReservationPaymentSummary {
  payments: ReservationPayment[];
}

export interface ReservationPaymentRegistration
  extends ReservationPaymentSummary {
  payment: ReservationPayment;
}

export function isReservationPaymentMethod(
  value: unknown,
): value is ReservationPaymentMethod {
  return RESERVATION_PAYMENT_METHODS.some((method) => method === value);
}

export function parseMoneyCents(value: unknown, field: string): bigint {
  if (typeof value !== 'string') {
    throw new ReservationInvalidFieldError(field);
  }
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new ReservationInvalidFieldError(field);

  const cents =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  if (cents > MAX_NUMERIC_CENTS) {
    throw new ReservationInvalidFieldError(field);
  }
  return cents;
}

export function formatMoneyCents(cents: bigint): string {
  const absoluteCents = cents < 0n ? -cents : cents;
  const sign = cents < 0n ? '-' : '';
  return `${sign}${absoluteCents / 100n}.${(absoluteCents % 100n)
    .toString()
    .padStart(2, '0')}`;
}

export function validateReservationPaymentAmount(
  amount: unknown,
  totalAmount: string,
  totalPaid: string,
): bigint {
  const amountCents = parseMoneyCents(amount, 'amount');
  if (amountCents <= 0n) {
    throw new ReservationPaymentAmountInvalidError();
  }

  const totalCents = parseMoneyCents(totalAmount, 'totalAmount');
  const paidCents = parseMoneyCents(totalPaid, 'totalPaid');
  if (amountCents > totalCents - paidCents) {
    throw new AbonoExcedeSaldoError();
  }
  return amountCents;
}

export function prepareReservationConversionPayment(
  totalAmount: string,
  totalPaid: string,
  paymentMethod: ReservationPaymentMethod | null,
): { amount: string; paymentMethod: ReservationPaymentMethod } | null {
  const totalCents = parseMoneyCents(totalAmount, 'totalAmount');
  const paidCents = parseMoneyCents(totalPaid, 'totalPaid');
  const pendingCents = totalCents - paidCents;

  if (pendingCents < 0n) {
    throw new ReservationPaymentBalanceInvalidError();
  }
  if (pendingCents === 0n) return null;
  if (!paymentMethod) throw new ReservationPaymentMethodRequiredError();

  return {
    amount: formatMoneyCents(
      validateReservationPaymentAmount(
        formatMoneyCents(pendingCents),
        totalAmount,
        totalPaid,
      ),
    ),
    paymentMethod,
  };
}

export function calculateReservationPaymentSummary(
  totalAmount: string,
  totalPaid: string,
): ReservationPaymentSummary {
  const totalAmountCents = parseMoneyCents(totalAmount, 'totalAmount');
  const totalPaidCents = parseMoneyCents(totalPaid, 'totalPaid');
  return {
    totalAmount: formatMoneyCents(totalAmountCents),
    totalPaid: formatMoneyCents(totalPaidCents),
    pendingBalance: formatMoneyCents(totalAmountCents - totalPaidCents),
  };
}
