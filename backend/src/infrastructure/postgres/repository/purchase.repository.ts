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
  CreatePurchaseData,
  CreatePurchaseItemData,
  IPurchaseRepository,
  ReceiveItemInput,
  UpdatePurchaseData,
} from '../../../application/port/purchase.repository';
import type {
  PurchaseStatus,
  PurchaseWithItems,
} from '../../../domain/entities/purchase.entity';
import { PurchaseStateConflictError } from '../../../domain/errors/purchase.errors';
import { db } from '../db/connection';
import { productTable } from '../db/schema/product';
import { purchaseTable } from '../db/schema/purchase';
import { purchaseItemTable } from '../db/schema/purchaseItem';
import { supplierTable } from '../db/schema/supplier';
import {
  toPurchaseDomain,
  toPurchaseItemDomain,
} from '../mappers/purchase.mapper';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class PurchaseRepository implements IPurchaseRepository {
  private baseSelect() {
    return db
      .select({
        purchase: purchaseTable,
        supplier: {
          id: supplierTable.id,
          companyName: supplierTable.companyName,
        },
      })
      .from(purchaseTable)
      .leftJoin(supplierTable, eq(purchaseTable.supplierId, supplierTable.id));
  }

  private fetchItems(purchaseIds: string[]) {
    return db
      .select({
        item: purchaseItemTable,
        product: {
          id: productTable.id,
          sku: productTable.sku,
          name: productTable.name,
        },
      })
      .from(purchaseItemTable)
      .leftJoin(productTable, eq(purchaseItemTable.productId, productTable.id))
      .where(inArray(purchaseItemTable.purchaseId, purchaseIds));
  }

  private toItemRow(purchaseId: string, item: CreatePurchaseItemData) {
    return {
      purchaseId,
      productId: item.productId,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: null,
      unitCostForeign: item.unitCostForeign,
      unitCostPen: item.unitCostPen,
      unitLandedCost: item.unitLandedCost,
    };
  }

  private async guardedUpdate(
    tx: Tx,
    id: string,
    values: Partial<typeof purchaseTable.$inferInsert>,
  ): Promise<void> {
    const [row] = await tx
      .update(purchaseTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(purchaseTable.id, id),
          notInArray(purchaseTable.status, ['RECEIVED', 'CANCELLED']),
        ),
      )
      .returning({ id: purchaseTable.id });

    if (!row) throw new PurchaseStateConflictError();
  }

  async findAll(
    query?: string,
    status?: string,
    limit = 20,
    offset = 0,
  ): Promise<PurchaseWithItems[]> {
    const conditions: SQL[] = [];
    if (status)
      conditions.push(eq(purchaseTable.status, status as PurchaseStatus));
    if (query) {
      const sanitized = query
        .trim()
        .slice(0, 100)
        .replace(/[\\%_]/g, '\\$&');
      conditions.push(
        or(
          ilike(supplierTable.companyName, `%${sanitized}%`),
          ilike(purchaseTable.currency, `%${sanitized}%`),
        ) as SQL,
      );
    }

    const where = conditions.length
      ? sql.join(conditions, sql` AND `)
      : undefined;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const purchases = await this.baseSelect()
      .where(where)
      .orderBy(desc(purchaseTable.createdAt))
      .limit(safeLimit)
      .offset(safeOffset);

    if (!purchases.length) return [];

    const items = await this.fetchItems(purchases.map((p) => p.purchase.id));
    const itemsMap = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsMap.get(item.item.purchaseId) ?? [];
      list.push(item);
      itemsMap.set(item.item.purchaseId, list);
    }

    return purchases.map(({ purchase, supplier }) => ({
      ...toPurchaseDomain(purchase),
      supplier: supplier?.id ? supplier : undefined,
      items: (itemsMap.get(purchase.id) ?? []).map((r) => ({
        ...toPurchaseItemDomain(r.item),
        product: r.product?.id ? r.product : undefined,
      })),
    }));
  }

  async findById(id: string): Promise<PurchaseWithItems | null> {
    const [purchaseRows, items] = await Promise.all([
      this.baseSelect().where(eq(purchaseTable.id, id)).limit(1),
      this.fetchItems([id]),
    ]);

    const row = purchaseRows[0];
    if (!row) return null;

    return {
      ...toPurchaseDomain(row.purchase),
      supplier: row.supplier?.id ? row.supplier : undefined,
      items: items.map((r) => ({
        ...toPurchaseItemDomain(r.item),
        product: r.product?.id ? r.product : undefined,
      })),
    };
  }

  async create(data: CreatePurchaseData): Promise<string> {
    return await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(purchaseTable)
        .values({
          supplierId: data.supplierId,
          arrivalDate: data.arrivalDate,
          status: data.status,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          internationalFreight: data.internationalFreight,
          customsDuties: data.customsDuties,
        })
        .returning({ id: purchaseTable.id });

      if (data.items.length) {
        await tx
          .insert(purchaseItemTable)
          .values(data.items.map((i) => this.toItemRow(id, i)));
      }
      return id;
    });
  }

  async update(data: UpdatePurchaseData): Promise<void> {
    await db.transaction(async (tx) => {
      const { id, items, ...fields } = data;
      await this.guardedUpdate(tx, id, fields);

      if (items !== undefined) {
        await tx
          .delete(purchaseItemTable)
          .where(eq(purchaseItemTable.purchaseId, id));
        if (items.length) {
          await tx
            .insert(purchaseItemTable)
            .values(items.map((i) => this.toItemRow(id, i)));
        }
      }
    });
  }

  async cancel(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await this.guardedUpdate(tx, id, { status: 'CANCELLED' });
    });
  }

  async receive(
    id: string,
    receivedItems?: ReceiveItemInput[],
    arrivalDate?: Date | null,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();
      await this.guardedUpdate(tx, id, {
        status: 'RECEIVED',
        arrivalDate: arrivalDate || now,
      });

      const items = await tx
        .select()
        .from(purchaseItemTable)
        .where(eq(purchaseItemTable.purchaseId, id));
      const receivedMap = new Map(
        receivedItems?.map((r) => [r.productId, r.quantityReceived]),
      );

      for (const item of items) {
        const qty = receivedMap.has(item.productId)
          ? (receivedMap.get(item.productId) as number)
          : (item.quantityReceived ?? item.quantityOrdered);

        await tx
          .update(purchaseItemTable)
          .set({ quantityReceived: qty, updatedAt: now })
          .where(eq(purchaseItemTable.id, item.id));

        if (qty > 0) {
          await tx
            .update(productTable)
            .set({ stock: sql`${productTable.stock} + ${qty}`, updatedAt: now })
            .where(eq(productTable.id, item.productId));
        }
      }
    });
  }
}
