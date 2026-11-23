import {
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { clientTable } from './client';
import { reservationTable } from './reservation';
import { auditColumns } from './utils';

export const saleStatusEnum = pgEnum('saleStatus', [
  'PENDING_PAYMENT',
  'PENDING_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const saleTable = pgTable(
  'sale',
  {
    id: uuid()
      .primaryKey()
      .defaultRandom()
      .$defaultFn(() => uuidv7()),
    clientId: uuid()
      .notNull()
      .references(() => clientTable.id),
    reservationId: uuid().references(() => reservationTable.id),
    totalAmount: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    saleDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
    status: saleStatusEnum().notNull().default('PENDING_PAYMENT'),
    ...auditColumns,
  },
  (table) => [uniqueIndex('sale_reservation_unique').on(table.reservationId)],
);

export type SaleModel = typeof saleTable.$inferSelect;
export type NewSaleModel = typeof saleTable.$inferInsert;
