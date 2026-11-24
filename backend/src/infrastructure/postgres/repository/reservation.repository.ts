import { and, asc, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import type {
  CancelReservationData,
  ConvertReservationData,
  CreateReservationData,
  CreateReservationPaymentData,
  IReservationRepository,
  ReservationConversionResult,
} from '../../../application/port/reservation.repository';
import type {
  Reservation,
  ReservationItemWithProduct,
  ReservationWithItems,
  ReservationWithPaymentTotal,
} from '../../../domain/entities/reservation.entity';
import {
  normalizeCancellationReason,
  validateCancellationPaymentConfirmation,
  validateReservationCancellationState,
  validateReservationConversionState,
  validateReservationConversionStock,
} from '../../../domain/entities/reservation.entity';
import {
  formatMoneyCents,
  parseMoneyCents,
  prepareReservationConversionPayment,
  type ReservationPayment,
  type ReservationPaymentBalance,
  validateReservationPaymentAmount,
} from '../../../domain/entities/reservationPayment.entity';
import {
  EmptyReservationItemsError,
  ReservationAlreadyConvertedError,
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
import { saleTable } from '../db/schema/sale';
import { saleItemTable } from '../db/schema/saleItem';
import {
  toReservationDomain,
  toReservationItemDomain,
  toReservationPaymentDomain,
} from '../mappers/reservation.mapper';
import { toSaleDomain, toSaleItemDomain } from '../mappers/sale.mapper';
import { insertSaleTransaction } from './sale-transaction.repository';

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
        sale: {
          id: saleTable.id,
          status: saleTable.status,
        },
        totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
      })
      .from(reservationTable)
      .leftJoin(clientTable, eq(reservationTable.clientId, clientTable.id))
      .leftJoin(
        reservationPaymentTable,
        eq(reservationPaymentTable.reservationId, reservationTable.id),
      )
      .leftJoin(saleTable, eq(saleTable.reservationId, reservationTable.id))
      .groupBy(reservationTable.id, clientTable.id, saleTable.id)
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

    return reservations.map(({ reservation, client, totalPaid, sale }) => ({
      ...this.toReservationWithItems(
        reservation,
        client,
        itemsByReservation.get(reservation.id) ?? [],
      ),
      totalPaid,
      sale:
        sale?.id && sale.status
          ? { id: sale.id, status: sale.status }
          : undefined,
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

  async cancel(data: CancelReservationData): Promise<Reservation> {
    return await db.transaction(async (tx) => {
      const [reservation] = await tx
        .select()
        .from(reservationTable)
        .where(eq(reservationTable.id, data.id))
        .for('update')
        .limit(1);
      if (!reservation) throw new ReservationNotFoundError();

      validateReservationCancellationState(reservation.status);
      const reason = normalizeCancellationReason(data.reason);

      const [paymentSum] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
        })
        .from(reservationPaymentTable)
        .where(eq(reservationPaymentTable.reservationId, data.id));
      validateCancellationPaymentConfirmation(
        paymentSum.totalPaid,
        data.confirmWithPayments,
      );

      const items = await tx
        .select({
          productId: reservationItemTable.productId,
          cantidadBloqueada: reservationItemTable.cantidadBloqueada,
        })
        .from(reservationItemTable)
        .where(
          and(
            eq(reservationItemTable.reservationId, data.id),
            gt(reservationItemTable.cantidadBloqueada, 0),
          ),
        );
      const quantityByProduct = new Map<string, number>();
      for (const item of items) {
        quantityByProduct.set(
          item.productId,
          (quantityByProduct.get(item.productId) ?? 0) + item.cantidadBloqueada,
        );
      }

      const productIds = [...quantityByProduct.keys()];
      const products = productIds.length
        ? await tx
            .select({ id: productTable.id })
            .from(productTable)
            .where(inArray(productTable.id, productIds))
            .orderBy(asc(productTable.id))
            .for('update')
        : [];
      const lockedProductIds = new Set(products.map((product) => product.id));

      for (const productId of productIds) {
        if (!lockedProductIds.has(productId)) {
          throw new ReservationProductNotFoundError(productId);
        }
        await tx
          .update(productTable)
          .set({
            stock: sql`${productTable.stock} + ${quantityByProduct.get(productId)}`,
            updatedAt: new Date(),
          })
          .where(eq(productTable.id, productId));
      }

      const cancelledAt = new Date();
      const [updated] = await tx
        .update(reservationTable)
        .set({
          status: 'CANCELADA',
          cancellationReason: reason,
          cancelledAt,
          updatedAt: cancelledAt,
        })
        .where(
          and(
            eq(reservationTable.id, data.id),
            eq(reservationTable.status, 'VIGENTE'),
          ),
        )
        .returning();
      if (!updated) throw new ReservationNotFoundError();

      return toReservationDomain(updated);
    });
  }

  async convertToSale(
    data: ConvertReservationData,
  ): Promise<ReservationConversionResult> {
    return await db.transaction(async (tx) => {
      const [reservation] = await tx
        .select()
        .from(reservationTable)
        .where(eq(reservationTable.id, data.id))
        .for('update')
        .limit(1);
      if (!reservation) throw new ReservationNotFoundError();

      validateReservationConversionState(reservation.status);

      const [paymentSum] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${reservationPaymentTable.amount}), 0)::text`,
        })
        .from(reservationPaymentTable)
        .where(eq(reservationPaymentTable.reservationId, data.id));
      const finalPayment = prepareReservationConversionPayment(
        reservation.totalAmount,
        paymentSum.totalPaid,
        data.paymentMethod,
      );

      const items = await tx
        .select()
        .from(reservationItemTable)
        .where(eq(reservationItemTable.reservationId, data.id));
      if (!items.length) throw new EmptyReservationItemsError();

      const quantityByProduct = new Map<string, number>();
      for (const item of items) {
        const quantityPending = item.quantity - item.cantidadBloqueada;
        if (quantityPending > 0) {
          quantityByProduct.set(
            item.productId,
            (quantityByProduct.get(item.productId) ?? 0) + quantityPending,
          );
        }
      }

      const productIds = [...quantityByProduct.keys()];
      const products = productIds.length
        ? await tx
            .select({
              id: productTable.id,
              name: productTable.name,
              stock: productTable.stock,
            })
            .from(productTable)
            .where(inArray(productTable.id, productIds))
            .orderBy(asc(productTable.id))
            .for('update')
        : [];
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const productId of productIds) {
        const product = productsById.get(productId);
        if (!product) throw new ReservationProductNotFoundError(productId);

        validateReservationConversionStock(
          product.name,
          product.stock,
          quantityByProduct.get(productId) ?? 0,
        );
      }

      const convertedAt = new Date();
      for (const product of products) {
        const quantity = quantityByProduct.get(product.id) ?? 0;
        await tx
          .update(productTable)
          .set({
            stock: sql`${productTable.stock} - ${quantity}`,
            updatedAt: convertedAt,
          })
          .where(eq(productTable.id, product.id));
      }

      let payment: ReservationPayment | null = null;
      if (finalPayment) {
        const [createdPayment] = await tx
          .insert(reservationPaymentTable)
          .values({
            reservationId: data.id,
            amount: finalPayment.amount,
            paymentMethod: finalPayment.paymentMethod,
          })
          .returning();
        payment = toReservationPaymentDomain(createdPayment);
      }

      const [createdSale] = await tx
        .insert(saleTable)
        .values({
          clientId: reservation.clientId,
          reservationId: reservation.id,
          totalAmount: reservation.totalAmount,
          saleDate: convertedAt,
          status: 'PENDING_DELIVERY',
        })
        .returning();

      await tx.insert(saleItemTable).values(
        items.map((item) => ({
          saleId: createdSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
          subtotal: item.lineTotal,
        })),
      );

      await insertSaleTransaction(tx, createdSale.id, reservation.totalAmount);

      const [updatedReservation] = await tx
        .update(reservationTable)
        .set({ status: 'CONVERTIDA', updatedAt: convertedAt })
        .where(
          and(
            eq(reservationTable.id, data.id),
            eq(reservationTable.status, 'VIGENTE'),
          ),
        )
        .returning();
      if (!updatedReservation) throw new ReservationAlreadyConvertedError();

      const saleItems = await tx
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
        .where(eq(saleItemTable.saleId, createdSale.id));
      const [client] = await tx
        .select({
          id: clientTable.id,
          name: clientTable.name,
          lastName: clientTable.lastName,
          phone: clientTable.phone,
        })
        .from(clientTable)
        .where(eq(clientTable.id, reservation.clientId))
        .limit(1);

      const totalPaidCents =
        parseMoneyCents(paymentSum.totalPaid, 'totalPaid') +
        (payment ? parseMoneyCents(payment.amount, 'amount') : 0n);
      const sale = {
        ...toSaleDomain(createdSale),
        client: client?.id ? client : undefined,
        items: saleItems.map((row) => ({
          ...toSaleItemDomain(row.item),
          product: row.product?.id ? row.product : undefined,
        })),
      };

      return {
        reservation: {
          id: updatedReservation.id,
          status: 'CONVERTIDA',
          totalAmount: updatedReservation.totalAmount,
          totalPaid: formatMoneyCents(totalPaidCents),
          pendingBalance: formatMoneyCents(
            parseMoneyCents(updatedReservation.totalAmount, 'totalAmount') -
              totalPaidCents,
          ),
        },
        sale,
        payment,
      };
    });
  }
}
