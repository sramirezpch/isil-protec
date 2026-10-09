import { sql } from 'drizzle-orm';
import { boolean, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';

export const formatoTable = pgTable('formato', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  name: varchar({ length: 255 }).notNull(),
  active: boolean().notNull().default(true),
  ...auditColumns,
},(table) => [
    uniqueIndex('formato_name_normalized_unique').on(
      sql`lower(trim(${table.name}))`,
    ),
  ],);

export type FormatoModel = typeof formatoTable.$inferSelect;
export type NewFormatoModel = typeof formatoTable.$inferInsert;
