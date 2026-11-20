import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { productTable } from './product';
import { reservationTable } from './reservation';
import { auditColumns } from './utils';

export const reservationDiscountTypeEnum = pgEnum('reservationDiscountType', [
  'PORCENTAJE',
  'MONTO',
]);

export const reservationItemTable = pgTable(
  'reservationItem',
  {
    id: uuid()
      .primaryKey()
      .defaultRandom()
      .$defaultFn(() => uuidv7()),
    reservationId: uuid()
      .notNull()
      .references(() => reservationTable.id),
    productId: uuid()
      .notNull()
      .references(() => productTable.id),
    quantity: integer().notNull(),
    cantidadBloqueada: integer().notNull(),
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    discountType: reservationDiscountTypeEnum(),
    discountValue: numeric({ precision: 12, scale: 2 }),
    lineTotal: numeric({ precision: 12, scale: 2 }).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex('reservationItem_reservation_product_unique').on(
      table.reservationId,
      table.productId,
    ),
    check('reservationItem_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'reservationItem_blocked_quantity_valid',
      sql`${table.cantidadBloqueada} >= 0 AND ${table.cantidadBloqueada} <= ${table.quantity}`,
    ),
  ],
);

export type ReservationItemModel = typeof reservationItemTable.$inferSelect;
export type NewReservationItemModel = typeof reservationItemTable.$inferInsert;
