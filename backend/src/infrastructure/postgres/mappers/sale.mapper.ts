import type { Sale } from '../../../domain/entities/sale.entity';
import type { SaleItem } from '../../../domain/entities/saleItem.entity';
import type { SaleModel } from '../db/schema/sale';
import type { SaleItemModel } from '../db/schema/saleItem';

export const toSaleDomain = (row: SaleModel): Sale => ({
  id: row.id,
  clientId: row.clientId,
  totalAmount: row.totalAmount,
  saleDate: row.saleDate,
  status: row.status as Sale['status'],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toSaleItemDomain = (row: SaleItemModel): SaleItem => ({
  id: row.id,
  saleId: row.saleId,
  productId: row.productId,
  quantity: row.quantity,
  unitPrice: row.unitPrice,
  subtotal: row.subtotal,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});
