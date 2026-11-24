import { sql } from 'drizzle-orm';
import {
  check,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { RESERVATION_PAYMENT_METHODS } from '../../../../domain/entities/reservationPayment.entity';
import { reservationTable } from './reservation';

export const reservationPaymentMethodEnum = pgEnum(
  'reservationPaymentMethod',
  RESERVATION_PAYMENT_METHODS,
);

export const reservationPaymentTable = pgTable(
  'reservationPayment',
  {
    id: uuid()
      .primaryKey()
      .defaultRandom()
      .$defaultFn(() => uuidv7()),
    reservationId: uuid()
      .notNull()
      .references(() => reservationTable.id),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    paymentMethod: reservationPaymentMethodEnum().notNull(),
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reservationPayment_reservation_idx').on(table.reservationId),
    check('reservationPayment_amount_positive', sql`${table.amount} > 0`),
  ],
);

export type ReservationPaymentModel =
  typeof reservationPaymentTable.$inferSelect;
