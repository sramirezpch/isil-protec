import { uuid } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { numeric } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { franchiseTable } from './franchise';
import { lineaTable } from './linea';
import { auditColumns } from './utils';
import { boolean } from 'drizzle-orm/pg-core';

export const productTable = pgTable('product', {
    id: uuid()
        .primaryKey()
        .defaultRandom()
        .$defaultFn(() => uuidv7()),
    sku: text().notNull().unique(),
    name: varchar().notNull(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    stock: integer().notNull(),
    active: boolean().default(true).notNull(),
    franchiseId: uuid()
        .notNull()
        .references(() => franchiseTable.id),
    lineaId: uuid()
        .notNull()
        .references(() => lineaTable.id),
    ...auditColumns,
});

export type ProductModel = typeof productTable.$inferSelect;
export type NewProductModel = typeof productTable.$inferInsert;
