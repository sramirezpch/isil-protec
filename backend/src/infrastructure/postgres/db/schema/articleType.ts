import { sql } from 'drizzle-orm';
import { boolean, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { auditColumns } from './utils';

export const articleTypeTable = pgTable(
  'article_type',
  {
    id: uuid()
      .primaryKey()
      .defaultRandom()
      .$defaultFn(() => uuidv7()),
    name: varchar({ length: 255 }).notNull(),
    active: boolean().notNull().default(true),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex('article_type_name_normalized_unique').on(
      sql`lower(trim(${table.name}))`,
    ),
  ],
);

export type ArticleTypeModel = typeof articleTypeTable.$inferSelect;
export type NewArticleTypeModel = typeof articleTypeTable.$inferInsert;