import { date, numeric, pgEnum, pgTable, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { clientTable } from './client';
import { auditColumns } from './utils';

export const reservationStatusEnum = pgEnum('reservationStatus', ['VIGENTE']);

export const reservationTable = pgTable('reservation', {
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
  ...auditColumns,
});

export type ReservationModel = typeof reservationTable.$inferSelect;
export type NewReservationModel = typeof reservationTable.$inferInsert;
