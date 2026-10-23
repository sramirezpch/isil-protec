import { numeric, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { supplierTable } from './supplier';
import { auditColumns } from './utils';

export const purchaseStatusEnum = pgEnum('purchaseStatus', [
  'PENDING',
  'RECEIVED',
  'CANCELLED',
]);

export const purchaseTable = pgTable('purchase', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  supplierId: uuid()
    .notNull()
    .references(() => supplierTable.id),
  arrivalDate: timestamp({ withTimezone: true }),
  status: purchaseStatusEnum().notNull().default('PENDING'),
  currency: varchar({ length: 10 }).notNull(),
  exchangeRate: numeric({ precision: 12, scale: 4 }).notNull(),
  internationalFreight: numeric({ precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  customsDuties: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
  ...auditColumns,
});

export type PurchaseModel = typeof purchaseTable.$inferSelect;
export type NewPurchaseModel = typeof purchaseTable.$inferInsert;
