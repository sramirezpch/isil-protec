import { integer, pgTable, varchar, boolean } from "drizzle-orm/pg-core";

export const formatoTable = pgTable("formato", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  nombre: varchar({ length: 255 }).notNull(),
  estado: boolean().notNull().default(true),
});
