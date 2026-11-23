import { sql } from 'drizzle-orm';
import { check, integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { productTable } from './product';
import { reservationDiscountTypeEnum } from './reservationItem';
import { saleTable } from './sale';
import { auditColumns } from './utils';

export const saleItemTable = pgTable(
  'saleItem',
  {
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
    discountType: reservationDiscountTypeEnum(),
    discountValue: numeric({ precision: 12, scale: 2 }),
    subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
    ...auditColumns,
  },
  (table) => [
    check('saleItem_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'saleItem_discount_details_consistent',
      sql`(
        (${table.discountType} IS NULL AND ${table.discountValue} IS NULL)
        OR
        (${table.discountType} IS NOT NULL AND ${table.discountValue} IS NOT NULL)
      )`,
    ),
    check(
      'saleItem_discount_value_valid',
      sql`(
        ${table.discountType} IS NULL
        OR (
          ${table.discountType}::text = 'PORCENTAJE'
          AND ${table.discountValue} >= 0
          AND ${table.discountValue} <= 100
        )
        OR (
          ${table.discountType}::text = 'MONTO'
          AND ${table.discountValue} >= 0
        )
      )`,
    ),
  ],
);

export type SaleItemModel = typeof saleItemTable.$inferSelect;
export type NewSaleItemModel = typeof saleItemTable.$inferInsert;
