export type TransactionType = 'sale' | 'purchase';

export interface Transaction {
  id: string;
  saleId: string | null;
  purchaseId: string | null;
  type: TransactionType;
  amount: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
