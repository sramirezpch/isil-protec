import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import type {
  CreateSaleData,
  CreateSaleItemData,
  ISaleRepository,
} from '../../../application/port/sale.repository';
import type {
  SaleStatus,
  SaleWithItems,
} from '../../../domain/entities/sale.entity';
import { SaleStateConflictError } from '../../../domain/errors/sale.errors';
import { db } from '../db/connection';
import { clientTable } from '../db/schema/client';
import { productTable } from '../db/schema/product';
import { saleTable } from '../db/schema/sale';
import { saleItemTable } from '../db/schema/saleItem';
import { transactionTable } from '../db/schema/transaction';
import { toSaleDomain, toSaleItemDomain } from '../mappers/sale.mapper';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class SaleRepository implements ISaleRepository {
  private baseSelect() {
    return db
      .select({
        sale: saleTable,
        client: {
          id: clientTable.id,
          name: clientTable.name,
          lastName: clientTable.lastName,
          phone: clientTable.phone,
          aliasTiktok: clientTable.aliasTiktok
        },
      })
      .from(saleTable)
      .leftJoin(clientTable, eq(saleTable.clientId, clientTable.id));
  }

  private fetchItems(saleIds: string[]) {
    return db
      .select({
        item: saleItemTable,
        product: {
          id: productTable.id,
          sku: productTable.sku,
          name: productTable.name,
        },
      })
      .from(saleItemTable)
      .leftJoin(productTable, eq(saleItemTable.productId, productTable.id))
      .where(inArray(saleItemTable.saleId, saleIds));
  }

  private async insertItems(
    tx: Tx,
    saleId: string,
    items: CreateSaleItemData[],
  ): Promise<void> {
    if (!items.length) return;

    await tx.insert(saleItemTable).values(
      items.map((item) => ({
        saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    );
  }

  private async guardedStatusUpdate(
    tx: Tx,
    id: string,
    status: SaleStatus,
    allowedCurrentStatuses: SaleStatus[],
  ): Promise<void> {
    const [row] = await tx
      .update(saleTable)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(saleTable.id, id),
          inArray(saleTable.status, allowedCurrentStatuses),
        ),
      )
      .returning({ id: saleTable.id });

    if (!row) throw new SaleStateConflictError();
  }

  async findAll(
    query?: string,
    status?: string,
    limit = 20,
    offset = 0,
  ): Promise<SaleWithItems[]> {
    const conditions: SQL[] = [];
    if (status)
      conditions.push(eq(saleTable.status, status as SaleStatus));
    if (query) {
      const sanitized = query
        .trim()
        .slice(0, 100)
        .replace(/[\\%_]/g, '\\$&');
      conditions.push(
        or(
          ilike(clientTable.name, `%${sanitized}%`),
          ilike(clientTable.phone, `%${sanitized}%`),
          ilike(clientTable.aliasTiktok, `%${sanitized}%`)
        ) as SQL,
      );
    }

    const where = conditions.length
      ? sql.join(conditions, sql` AND `)
      : undefined;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const sales = await this.baseSelect()
      .where(where)
      .orderBy(desc(saleTable.createdAt))
      .limit(safeLimit)
      .offset(safeOffset);

    if (!sales.length) return [];

    const items = await this.fetchItems(sales.map((s) => s.sale.id));
    const itemsMap = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsMap.get(item.item.saleId) ?? [];
      list.push(item);
      itemsMap.set(item.item.saleId, list);
    }

    return sales.map(({ sale, client }) => ({
      ...toSaleDomain(sale),
      client: client?.id ? client : undefined,
      items: (itemsMap.get(sale.id) ?? []).map((r) => ({
        ...toSaleItemDomain(r.item),
        product: r.product?.id ? r.product : undefined,
      })),
    }));
  }

  async findById(id: string): Promise<SaleWithItems | null> {
    const [saleRows, items] = await Promise.all([
      this.baseSelect().where(eq(saleTable.id, id)).limit(1),
      this.fetchItems([id]),
    ]);

    const row = saleRows[0];
    if (!row) return null;

    return {
      ...toSaleDomain(row.sale),
      client: row.client?.id ? row.client : undefined,
      items: items.map((r) => ({
        ...toSaleItemDomain(r.item),
        product: r.product?.id ? r.product : undefined,
      })),
    };
  }

  async create(data: CreateSaleData): Promise<string> {
    return await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(saleTable)
        .values({
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          saleDate: data.saleDate,
          status: 'PENDING_PAYMENT',
        })
        .returning({ id: saleTable.id });

      await this.insertItems(tx, id, data.items);

      return id;
    });
  }

  async update(id: string, data: CreateSaleData): Promise<void> {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .update(saleTable)
        .set({
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          saleDate: data.saleDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(saleTable.id, id),
            eq(saleTable.status, 'PENDING_PAYMENT'),
          ),
        )
        .returning({ id: saleTable.id });

      if (!row) throw new SaleStateConflictError();

      await tx.delete(saleItemTable).where(eq(saleItemTable.saleId, id));
      await this.insertItems(tx, id, data.items);
    });
  }

  async updateStatus(id: string, status: SaleStatus): Promise<void> {
    await db.transaction(async (tx) => {
      // Determine allowed source statuses for the target status
      const allowedMap: Record<string, SaleStatus[]> = {
        PENDING_PAYMENT: ['CANCELLED'],
        PENDING_DELIVERY: ['PENDING_PAYMENT'],
        DELIVERED: ['PENDING_DELIVERY'],
      };
      const allowed = allowedMap[status] ?? [];
      await this.guardedStatusUpdate(tx, id, status, allowed);

      // When transitioning to PENDING_DELIVERY, register a sale transaction
      if (status === 'PENDING_DELIVERY') {
        const [sale] = await tx
          .select({ totalAmount: saleTable.totalAmount })
          .from(saleTable)
          .where(eq(saleTable.id, id))
          .limit(1);

        if (sale) {
          await tx.insert(transactionTable).values({
            saleId: id,
            purchaseId: null,
            type: 'sale',
            amount: sale.totalAmount,
            transactionDate: new Date(),
          });
        }

        // Reduce stock for each sale item
        const items = await tx
          .select()
          .from(saleItemTable)
          .where(eq(saleItemTable.saleId, id));

        for (const item of items) {
          await tx
            .update(productTable)
            .set({
              stock: sql`${productTable.stock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productTable.id, item.productId));
        }
      }
    });
  }

  async cancel(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await this.guardedStatusUpdate(tx, id, 'CANCELLED', ['PENDING_PAYMENT']);
    });
  }
}
