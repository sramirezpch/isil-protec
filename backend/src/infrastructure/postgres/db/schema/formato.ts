import { integer, pgTable, varchar, boolean } from "drizzle-orm/pg-core";

export const formatoTable = pgTable("formato", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  active: boolean().notNull().default(true),
});
