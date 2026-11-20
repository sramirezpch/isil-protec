import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  CreateReservationData,
  IReservationRepository,
} from '../../../application/port/reservation.repository';
import type {
  ReservationItemWithProduct,
  ReservationWithItems,
} from '../../../domain/entities/reservation.entity';
import {
  ReservationClientNotFoundError,
  ReservationPriceChangedError,
  ReservationProductNotFoundError,
} from '../../../domain/errors/reservation.errors';
import { db } from '../db/connection';
import { clientTable } from '../db/schema/client';
import { productTable } from '../db/schema/product';
import { reservationTable } from '../db/schema/reservation';
import { reservationItemTable } from '../db/schema/reservationItem';
import {
  toReservationDomain,
  toReservationItemDomain,
} from '../mappers/reservation.mapper';

export class ReservationRepository implements IReservationRepository {
  private baseSelect() {
    return db
      .select({
        reservation: reservationTable,
        client: {
          id: clientTable.id,
          name: clientTable.name,
          lastName: clientTable.lastName,
          phone: clientTable.phone,
        },
      })
      .from(reservationTable)
      .leftJoin(clientTable, eq(reservationTable.clientId, clientTable.id));
  }

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

  async findAll(): Promise<ReservationWithItems[]> {
    const reservations = await this.baseSelect().orderBy(
      desc(reservationTable.createdAt),
    );
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

    return reservations.map(({ reservation, client }) =>
      this.toReservationWithItems(
        reservation,
        client,
        itemsByReservation.get(reservation.id) ?? [],
      ),
    );
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
}
