import { uuid, varchar, text, pgTable } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';
import { boolean } from 'drizzle-orm/pg-core';

export const supplierTable = pgTable('supplier', {
    id: uuid()
        .primaryKey()
        .defaultRandom()
        .$defaultFn(() => uuidv7()),
    companyName: varchar().notNull(),
    country: varchar().notNull(),
    taxId: varchar().notNull(),
    address: text().notNull(),
    contactName: varchar().notNull(),
    email: varchar().notNull(),
    phone: varchar().unique().notNull(),
    active: boolean().default(true).notNull(),
    ...auditColumns,
})

export type SupplierModel = typeof supplierTable.$inferSelect;
export type NewSupplierModel = typeof supplierTable.$inferInsert;