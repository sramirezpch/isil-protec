import { sql } from 'drizzle-orm';
import {
  check,
  date,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { clientTable } from './client';
import { auditColumns } from './utils';

export const reservationStatusEnum = pgEnum('reservationStatus', [
  'VIGENTE',
  'CANCELADA',
  'CONVERTIDA',
]);

export const reservationTable = pgTable(
  'reservation',
  {
    id: uuid()
      .primaryKey()
      .defaultRandom()
      .$defaultFn(() => uuidv7()),
    clientId: uuid()
      .notNull()
      .references(() => clientTable.id),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    status: reservationStatusEnum().notNull().default('VIGENTE'),
    totalAmount: numeric({ precision: 12, scale: 2 }).notNull(),
    cancellationReason: varchar({ length: 500 }),
    cancelledAt: timestamp({ withTimezone: true }),
    ...auditColumns,
  },
  (table) => [
    check(
      'reservation_cancellation_details_consistent',
      sql`(
        (${table.status}::text = 'CANCELADA'
          AND ${table.cancellationReason} IS NOT NULL
          AND ${table.cancelledAt} IS NOT NULL)
        OR
        (${table.status}::text <> 'CANCELADA'
          AND ${table.cancellationReason} IS NULL
          AND ${table.cancelledAt} IS NULL)
      )`,
    ),
  ],
);

export type ReservationModel = typeof reservationTable.$inferSelect;
export type NewReservationModel = typeof reservationTable.$inferInsert;
