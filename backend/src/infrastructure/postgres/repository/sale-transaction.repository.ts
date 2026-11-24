import type { db } from '../db/connection';
import { transactionTable } from '../db/schema/transaction';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function insertSaleTransaction(
  tx: Tx,
  saleId: string,
  amount: string,
): Promise<void> {
  await tx.insert(transactionTable).values({
    saleId,
    purchaseId: null,
    type: 'sale',
    amount,
    transactionDate: new Date(),
  });
}
