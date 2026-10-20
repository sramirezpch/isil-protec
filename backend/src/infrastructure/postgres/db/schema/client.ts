import { boolean, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';

export const clientTable = pgTable('client', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  phone: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  aliasTiktok: varchar('alias_tiktok', { length: 255 }),
  active: boolean().notNull().default(true),
  ...auditColumns,
}, (table) => [
  uniqueIndex('client_phone_unique').on(table.phone),
]);

export type ClientModel = typeof clientTable.$inferSelect;
export type NewClientModel = typeof clientTable.$inferInsert;