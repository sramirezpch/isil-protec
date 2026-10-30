import { integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { productTable } from './product';
import { saleTable } from './sale';
import { auditColumns } from './utils';

export const saleItemTable = pgTable('saleItem', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  saleId: uuid()
    .notNull()
    .references(() => saleTable.id),
  productId: uuid()
    .notNull()
    .references(() => productTable.id),
  quantity: integer().notNull(),
  unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
  subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
  ...auditColumns,
});

export type SaleItemModel = typeof saleItemTable.$inferSelect;
export type NewSaleItemModel = typeof saleItemTable.$inferInsert;
