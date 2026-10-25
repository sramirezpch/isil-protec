import { numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { clientTable } from './client';
import { auditColumns } from './utils';

export const saleStatusEnum = pgEnum('saleStatus', [
  'PENDING_PAYMENT',
  'PENDING_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const saleTable = pgTable('sale', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  clientId: uuid()
    .notNull()
    .references(() => clientTable.id),
  totalAmount: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
  saleDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
  status: saleStatusEnum().notNull().default('PENDING_PAYMENT'),
  ...auditColumns,
});

export type SaleModel = typeof saleTable.$inferSelect;
export type NewSaleModel = typeof saleTable.$inferInsert;
