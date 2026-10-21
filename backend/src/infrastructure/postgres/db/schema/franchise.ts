import { boolean, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { formatoTable } from './formato';
import { auditColumns } from './utils';

export const franchiseTable = pgTable('franchise', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  name: varchar({ length: 255 }).notNull(),
  active: boolean().notNull().default(true),
  formatoId: uuid('formato_id')
    .notNull()
    .references(() => formatoTable.id),
  ...auditColumns,
});

export type FranchiseModel = typeof franchiseTable.$inferSelect;
export type NewFranchiseModel = typeof franchiseTable.$inferInsert;
