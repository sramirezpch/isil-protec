import { sql } from 'drizzle-orm';
import { boolean, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';

export const lineaTable = pgTable('linea', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  name: varchar({ length: 255 }).notNull(),
  idmarca: uuid().notNull(),
  active: boolean().notNull().default(true),
  ...auditColumns,
}, (table) => [
  uniqueIndex('linea_name_normalized_unique').on(
    sql`lower(trim(${table.name}))`,
  ),
]);

export type LineaModel = typeof lineaTable.$inferSelect;
export type NewLineaModel = typeof lineaTable.$inferInsert;
