import { boolean, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
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
});

export type FormatoModel = typeof formatoTable.$inferSelect;
export type NewFormatoModel = typeof formatoTable.$inferInsert;
