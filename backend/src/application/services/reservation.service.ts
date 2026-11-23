import type {
  Reservation,
  ReservationWithItems,
  ReservationWithPaymentSummary,
} from '../../domain/entities/reservation.entity';
import { normalizeCancellationReason } from '../../domain/entities/reservation.entity';
import type { ReservationDiscountType } from '../../domain/entities/reservationItem.entity';
import {
  calculateReservationPaymentSummary,
  formatMoneyCents,
  isReservationPaymentMethod,
  MAX_NUMERIC_CENTS,
  parseMoneyCents,
  type ReservationPaymentHistory,
  type ReservationPaymentMethod,
  type ReservationPaymentRegistration,
  validateReservationPaymentAmount,
} from '../../domain/entities/reservationPayment.entity';
import {
  DuplicateReservationItemError,
  EmptyReservationItemsError,
  ReservationClientNotFoundError,
  ReservationDeadlineInvalidError,
  ReservationInvalidFieldError,
  ReservationNotFoundError,
  ReservationNotVigenteError,
  ReservationPaymentMethodInvalidError,
  ReservationProductNotFoundError,
} from '../../domain/errors/reservation.errors';
import type { IClientRepository } from '../port/client.repository';
import type { IProductRepository } from '../port/product.repository';
import type {
  CancelReservationData,
  ConvertReservationData,
  CreateReservationData,
  CreateReservationItemData,
  IReservationRepository,
} from '../port/reservation.repository';

export interface ReservationItemInput {
  productId: string;
  quantity: number | string;
  discountType?: ReservationDiscountType | null;
  discountValue?: string | null;
}

export interface CreateReservationInput {
  clientId?: string;
  dueDate?: string | null;
  items?: ReservationItemInput[];
}

export interface CreateReservationPaymentInput {
  reservationId: string;
  amount: unknown;
  paymentMethod: unknown;
}

export interface CancelReservationInput {
  id: string;
  reason: unknown;
  confirmWithPayments: unknown;
}

const MAX_INTEGER_QUANTITY = 2_147_483_647n;

export class ReservationService {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly clientRepository: IClientRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll(): Promise<ReservationWithPaymentSummary[]> {
    const reservations = await this.reservationRepository.findAll();
    return reservations.map((reservation) => ({
      ...reservation,
      ...calculateReservationPaymentSummary(
        reservation.totalAmount,
        reservation.totalPaid,
      ),
    }));
  }

  async create(input: CreateReservationInput): Promise<ReservationWithItems> {
    if (!input.clientId) throw new ReservationClientNotFoundError();

    const client = await this.clientRepository.findById(input.clientId);
    if (!client?.active) throw new ReservationClientNotFoundError();

    const dueDate = this.validateDueDate(input.dueDate);
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new EmptyReservationItemsError();
    }
    if (input.items.length > 200) {
      throw new ReservationInvalidFieldError('items (máximo 200 por reserva)');
    }

    const seenProductIds = new Set<string>();
    let totalCents = 0n;
    const items: CreateReservationItemData[] = [];

    for (const item of input.items) {
      if (!item.productId) {
        throw new ReservationInvalidFieldError('productId');
      }
      if (seenProductIds.has(item.productId)) {
        throw new DuplicateReservationItemError();
      }
      seenProductIds.add(item.productId);

      const quantity = this.parseQuantity(item.quantity);
      const product = await this.productRepository.findById(item.productId);
      if (!product?.active) {
        throw new ReservationProductNotFoundError(item.productId);
      }

      const unitPriceCents = parseMoneyCents(product.price, 'price');
      const subtotalCents = unitPriceCents * BigInt(quantity);
      if (subtotalCents > MAX_NUMERIC_CENTS) {
        throw new ReservationInvalidFieldError('subtotal');
      }

      const discount = this.calculateDiscount(
        item.discountType,
        item.discountValue,
        subtotalCents,
      );
      const lineTotalCents = subtotalCents - discount.cents;
      totalCents += lineTotalCents;
      if (totalCents > MAX_NUMERIC_CENTS) {
        throw new ReservationInvalidFieldError('total');
      }

      items.push({
        productId: item.productId,
        quantity,
        unitPrice: formatMoneyCents(unitPriceCents),
        discountType: discount.type,
        discountValue:
          discount.valueCents === null
            ? null
            : formatMoneyCents(discount.valueCents),
        lineTotal: formatMoneyCents(lineTotalCents),
      });
    }

    const data: CreateReservationData = {
      clientId: input.clientId,
      dueDate,
      status: 'VIGENTE',
      totalAmount: formatMoneyCents(totalCents),
      items,
    };
    return await this.reservationRepository.create(data);
  }

  async findPayments(id: string): Promise<ReservationPaymentHistory> {
    const result = await this.reservationRepository.findPayments(id);
    if (!result) throw new ReservationNotFoundError();

    const totalPaidCents = result.payments.reduce(
      (total, payment) => total + parseMoneyCents(payment.amount, 'amount'),
      0n,
    );
    return {
      ...calculateReservationPaymentSummary(
        result.totalAmount,
        formatMoneyCents(totalPaidCents),
      ),
      payments: result.payments,
    };
  }

  async createPayment(
    input: CreateReservationPaymentInput,
  ): Promise<ReservationPaymentRegistration> {
    if (!isReservationPaymentMethod(input.paymentMethod)) {
      throw new ReservationPaymentMethodInvalidError();
    }

    const balance = await this.reservationRepository.getPaymentBalance(
      input.reservationId,
    );
    if (!balance) throw new ReservationNotFoundError();
    if (balance.status !== 'VIGENTE') throw new ReservationNotVigenteError();

    const amountCents = validateReservationPaymentAmount(
      input.amount,
      balance.totalAmount,
      balance.totalPaid,
    );

    const created = await this.reservationRepository.createPayment({
      reservationId: input.reservationId,
      amount: formatMoneyCents(amountCents),
      paymentMethod: input.paymentMethod,
    });
    const totalPaidCents =
      parseMoneyCents(created.totalPaidBefore, 'totalPaid') + amountCents;
    return {
      ...calculateReservationPaymentSummary(
        created.totalAmount,
        formatMoneyCents(totalPaidCents),
      ),
      payment: created.payment,
    };
  }

  async cancel(input: CancelReservationInput): Promise<Reservation> {
    const reason = normalizeCancellationReason(input.reason);
    const data: CancelReservationData = {
      id: input.id,
      reason,
      confirmWithPayments: input.confirmWithPayments === true,
    };
    return await this.reservationRepository.cancel(data);
  }

  async convertToSale(input: { id: string; paymentMethod: unknown }) {
    let paymentMethod: ReservationPaymentMethod | null = null;
    if (input.paymentMethod !== undefined && input.paymentMethod !== null) {
      if (!isReservationPaymentMethod(input.paymentMethod)) {
        throw new ReservationPaymentMethodInvalidError();
      }
      paymentMethod = input.paymentMethod;
    }

    const data: ConvertReservationData = {
      id: input.id,
      paymentMethod,
    };
    return await this.reservationRepository.convertToSale(data);
  }

  private validateDueDate(value: unknown): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new ReservationDeadlineInvalidError();
    }

    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const calendarDate = new Date(0);
    calendarDate.setUTCHours(0, 0, 0, 0);
    calendarDate.setUTCFullYear(year, month - 1, day);
    if (
      year < 1 ||
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day
    ) {
      throw new ReservationDeadlineInvalidError();
    }

    const todayInPeru = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .reduce(
        (parts, part) => {
          if (part.type !== 'literal') parts[part.type] = part.value;
          return parts;
        },
        {} as Record<string, string>,
      );
    const today = `${todayInPeru.year}-${todayInPeru.month}-${todayInPeru.day}`;
    if (value < today) throw new ReservationDeadlineInvalidError();
    return value;
  }

  private parseQuantity(value: unknown): number {
    const raw = String(value);
    if (!/^\d+$/.test(raw)) {
      throw new ReservationInvalidFieldError('quantity');
    }
    const quantity = BigInt(raw);
    if (quantity < 1n || quantity > MAX_INTEGER_QUANTITY) {
      throw new ReservationInvalidFieldError('quantity');
    }
    return Number(quantity);
  }

  private calculateDiscount(
    type: unknown,
    value: unknown,
    subtotalCents: bigint,
  ): {
    type: ReservationDiscountType | null;
    valueCents: bigint | null;
    cents: bigint;
  } {
    if (type === undefined || type === null || type === '') {
      if (value !== undefined && value !== null && value !== '') {
        throw new ReservationInvalidFieldError('discount');
      }
      return { type: null, valueCents: null, cents: 0n };
    }
    if (type !== 'PORCENTAJE' && type !== 'MONTO') {
      throw new ReservationInvalidFieldError('discountType');
    }

    const valueCents = parseMoneyCents(value, 'discountValue');
    if (type === 'PORCENTAJE') {
      if (valueCents > 10_000n) {
        throw new ReservationInvalidFieldError('discountValue');
      }
      const discountCents = this.roundHalfUp(
        subtotalCents * valueCents,
        10_000n,
      );
      return { type, valueCents, cents: discountCents };
    }

    if (valueCents > subtotalCents) {
      throw new ReservationInvalidFieldError('discountValue');
    }
    return { type, valueCents, cents: valueCents };
  }

  private roundHalfUp(numerator: bigint, denominator: bigint): bigint {
    return (numerator + denominator / 2n) / denominator;
  }
}
