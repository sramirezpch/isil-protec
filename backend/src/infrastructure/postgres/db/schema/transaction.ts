import { numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';
import { purchaseTable } from './purchase';
import { saleTable } from './sale';
import { auditColumns } from './utils';

export const transactionTypeEnum = pgEnum('transactionType', ['sale', 'purchase']);

export const transactionTable = pgTable('transaction', {
  id: uuid()
    .primaryKey()
    .defaultRandom()
    .$defaultFn(() => uuidv7()),
  saleId: uuid().references(() => saleTable.id),
  purchaseId: uuid().references(() => purchaseTable.id),
  type: transactionTypeEnum().notNull(),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  transactionDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...auditColumns,
});

export type TransactionModel = typeof transactionTable.$inferSelect;
export type NewTransactionModel = typeof transactionTable.$inferInsert;
