import { integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { productTable } from './product';
import { purchaseTable } from './purchase';
import { auditColumns } from './utils';

export const purchaseItemTable = pgTable('purchaseItem', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  purchaseId: uuid()
    .notNull()
    .references(() => purchaseTable.id),
  productId: uuid()
    .notNull()
    .references(() => productTable.id),
  quantityOrdered: integer().notNull(),
  quantityReceived: integer(),
  unitCostForeign: numeric({ precision: 12, scale: 2 }).notNull(),
  unitCostPen: numeric({ precision: 12, scale: 2 }).notNull(),
  unitLandedCost: numeric({ precision: 12, scale: 2 }).notNull(),
  ...auditColumns,
});

export type PurchaseItemModel = typeof purchaseItemTable.$inferSelect;
export type NewPurchaseItemModel = typeof purchaseItemTable.$inferInsert;
