import { boolean, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';

export const brandTable = pgTable('brand', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  name: varchar({ length: 255 }).notNull(),
  active: boolean().notNull().default(true),
  ...auditColumns,
});

export type BrandModel = typeof brandTable.$inferSelect;
export type NewBrandModel = typeof brandTable.$inferInsert;
