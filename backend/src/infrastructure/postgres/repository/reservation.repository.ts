import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  CreateReservationData,
  CreateReservationPaymentData,
  IReservationRepository,
} from '../../../application/port/reservation.repository';
import type {
  ReservationItemWithProduct,
  ReservationWithItems,
  ReservationWithPaymentTotal,
} from '../../../domain/entities/reservation.entity';
import {
  formatMoneyCents,
  type ReservationPayment,
  type ReservationPaymentBalance,
  validateReservationPaymentAmount,
} from '../../../domain/entities/reservationPayment.entity';
import {
  ReservationClientNotFoundError,
  ReservationNotFoundError,
  ReservationNotVigenteError,
  ReservationPriceChangedError,
  ReservationProductNotFoundError,
} from '../../../domain/errors/reservation.errors';
import { db } from '../db/connection';
import { clientTable } from '../db/schema/client';
import { productTable } from '../db/schema/product';
import { reservationTable } from '../db/schema/reservation';
import { reservationItemTable } from '../db/schema/reservationItem';
import { reservationPaymentTable } from '../db/schema/reservationPayment';
import {
  toReservationDomain,
  toReservationItemDomain,
  toReservationPaymentDomain,
} from '../mappers/reservation.mapper';

export class ReservationRepository implements IReservationRepository {
  private fetchItems(reservationIds: string[]) {
    return db
      .select({
        item: reservationItemTable,
        product: {
          id: productTable.id,
          sku: productTable.sku,
          name: productTable.name,
        },
      })
      .from(reservationItemTable)
      .leftJoin(
        productTable,
        eq(reservationItemTable.productId, productTable.id),
      )
      .where(inArray(reservationItemTable.reservationId, reservationIds));
  }

  private toItemWithProduct(
    item: typeof reservationItemTable.$inferSelect,
    product: { id: string; sku: string; name: string } | null,
  ): ReservationItemWithProduct {
    return {
      ...toReservationItemDomain(item),
      product: product?.id ? product : undefined,
    };
  }

  private toReservationWithItems(
    reservation: typeof reservationTable.$inferSelect,
    client: {
      id: string;
      name: string | null;
      lastName: string | null;
      phone: string;
    } | null,
    items: ReservationItemWithProduct[],
  ): ReservationWithItems {
    return {
      ...toReservationDomain(reservation),
      type: items.every((item) => item.cantidadBloqueada === item.quantity)
        ? 'RESERVA'
        : 'PREVENTA',
      client: client?.id ? client : undefined,
      items,
    };
  }

  async findAll(): Promise<ReservationWithPaymentTotal[]> {
    const reservations = await db
      .select({
        reservation: reservationTable,
        client: {
          id: clientTable.id,
          name: clientTable.name,
          lastName: clientTable.lastName,
          phone: clientTable.phone,
        },
        totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
      })
      .from(reservationTable)
      .leftJoin(clientTable, eq(reservationTable.clientId, clientTable.id))
      .leftJoin(
        reservationPaymentTable,
        eq(reservationPaymentTable.reservationId, reservationTable.id),
      )
      .groupBy(reservationTable.id, clientTable.id)
      .orderBy(desc(reservationTable.createdAt));
    if (!reservations.length) return [];

    const items = await this.fetchItems(
      reservations.map((r) => r.reservation.id),
    );
    const itemsByReservation = new Map<string, ReservationItemWithProduct[]>();
    for (const { item, product } of items) {
      const current = itemsByReservation.get(item.reservationId) ?? [];
      current.push(this.toItemWithProduct(item, product));
      itemsByReservation.set(item.reservationId, current);
    }

    return reservations.map(({ reservation, client, totalPaid }) => ({
      ...this.toReservationWithItems(
        reservation,
        client,
        itemsByReservation.get(reservation.id) ?? [],
      ),
      totalPaid,
    }));
  }

  async create(data: CreateReservationData): Promise<ReservationWithItems> {
    return await db.transaction(async (tx) => {
      const [client] = await tx
        .select({
          id: clientTable.id,
          name: clientTable.name,
          lastName: clientTable.lastName,
          phone: clientTable.phone,
          active: clientTable.active,
        })
        .from(clientTable)
        .where(eq(clientTable.id, data.clientId))
        .for('update');

      if (!client?.active) throw new ReservationClientNotFoundError();

      const productIds = data.items.map((item) => item.productId);
      const products = await tx
        .select()
        .from(productTable)
        .where(inArray(productTable.id, productIds))
        .orderBy(asc(productTable.id))
        .for('update');
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      if (products.length !== data.items.length) {
        throw new ReservationProductNotFoundError();
      }

      for (const item of data.items) {
        const product = productsById.get(item.productId);
        if (!product?.active) {
          throw new ReservationProductNotFoundError(item.productId);
        }
        if (product.price !== item.unitPrice) {
          throw new ReservationPriceChangedError();
        }
      }

      const [reservation] = await tx
        .insert(reservationTable)
        .values({
          clientId: data.clientId,
          dueDate: data.dueDate,
          status: data.status,
          totalAmount: data.totalAmount,
        })
        .returning();

      const createdItems = [];
      for (const item of data.items) {
        const product = productsById.get(item.productId);
        if (!product) throw new ReservationProductNotFoundError(item.productId);

        const blockedQuantity =
          product.stock >= item.quantity ? item.quantity : 0;
        if (blockedQuantity > 0) {
          await tx
            .update(productTable)
            .set({
              stock: sql`${productTable.stock} - ${blockedQuantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productTable.id, product.id));
        }

        const [createdItem] = await tx
          .insert(reservationItemTable)
          .values({
            reservationId: reservation.id,
            productId: item.productId,
            quantity: item.quantity,
            cantidadBloqueada: blockedQuantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            lineTotal: item.lineTotal,
          })
          .returning();
        createdItems.push(
          this.toItemWithProduct(createdItem, {
            id: product.id,
            sku: product.sku,
            name: product.name,
          }),
        );
      }

      return this.toReservationWithItems(
        reservation,
        {
          id: client.id,
          name: client.name,
          lastName: client.lastName,
          phone: client.phone,
        },
        createdItems,
      );
    });
  }

  async getPaymentBalance(
    id: string,
  ): Promise<ReservationPaymentBalance | null> {
    const [reservation] = await db
      .select({
        status: reservationTable.status,
        totalAmount: reservationTable.totalAmount,
      })
      .from(reservationTable)
      .where(eq(reservationTable.id, id))
      .limit(1);
    if (!reservation) return null;

    const [sum] = await db
      .select({
        totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
      })
      .from(reservationPaymentTable)
      .where(eq(reservationPaymentTable.reservationId, id));

    return {
      status: reservation.status,
      totalAmount: reservation.totalAmount,
      totalPaid: sum.totalPaid,
    };
  }

  async findPayments(
    id: string,
  ): Promise<{ totalAmount: string; payments: ReservationPayment[] } | null> {
    const [reservation] = await db
      .select({ totalAmount: reservationTable.totalAmount })
      .from(reservationTable)
      .where(eq(reservationTable.id, id))
      .limit(1);
    if (!reservation) return null;

    const payments = await db
      .select()
      .from(reservationPaymentTable)
      .where(eq(reservationPaymentTable.reservationId, id))
      .orderBy(desc(reservationPaymentTable.recordedAt));

    return {
      totalAmount: reservation.totalAmount,
      payments: payments.map(toReservationPaymentDomain),
    };
  }

  async createPayment(data: CreateReservationPaymentData): Promise<{
    payment: ReservationPayment;
    totalAmount: string;
    totalPaidBefore: string;
  }> {
    return await db.transaction(async (tx) => {
      const [reservation] = await tx
        .select({
          status: reservationTable.status,
          totalAmount: reservationTable.totalAmount,
        })
        .from(reservationTable)
        .where(eq(reservationTable.id, data.reservationId))
        .for('update')
        .limit(1);
      if (!reservation) throw new ReservationNotFoundError();

      const [sum] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
        })
        .from(reservationPaymentTable)
        .where(eq(reservationPaymentTable.reservationId, data.reservationId));
      if (reservation.status !== 'VIGENTE') {
        throw new ReservationNotVigenteError();
      }

      const amountCents = validateReservationPaymentAmount(
        data.amount,
        reservation.totalAmount,
        sum.totalPaid,
      );

      const [payment] = await tx
        .insert(reservationPaymentTable)
        .values({
          reservationId: data.reservationId,
          amount: formatMoneyCents(amountCents),
          paymentMethod: data.paymentMethod,
        })
        .returning();

      return {
        payment: toReservationPaymentDomain(payment),
        totalAmount: reservation.totalAmount,
        totalPaidBefore: sum.totalPaid,
      };
    });
  }
}
