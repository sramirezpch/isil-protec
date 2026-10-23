import {
  DuplicatePurchaseItemError,
  EmptyPurchaseItemsError,
  InvalidNumericValueError,
  ProductNotFoundError,
  PurchaseAlreadyCancelledError,
  PurchaseAlreadyReceivedError,
  PurchaseNotFoundError,
  SupplierNotFoundError,
} from '../../domain/errors/purchase.errors';
import type { IProductRepository } from '../port/product.repository';
import type {
  CreatePurchaseItemData,
  IPurchaseRepository,
  ReceiveItemInput,
} from '../port/purchase.repository';
import type { ISupplierRepository } from '../port/supplier.repository';

export interface PurchaseItemInput {
  productId: string;
  quantityOrdered: number;
  unitCostForeign: number | string;
}

export interface CreatePurchaseInput {
  supplierId: string;
  arrivalDate?: string | Date | null;
  currency: string;
  exchangeRate: number | string;
  internationalFreight?: number | string;
  customsDuties?: number | string;
  items: PurchaseItemInput[];
}

export interface UpdatePurchaseInput {
  id: string;
  supplierId?: string;
  arrivalDate?: string | Date | null;
  currency?: string;
  exchangeRate?: number | string;
  internationalFreight?: number | string;
  customsDuties?: number | string;
  items?: PurchaseItemInput[];
}

export interface ReceivePurchaseInput {
  id: string;
  arrivalDate?: string | Date | null;
  items?: ReceiveItemInput[];
}

interface ParseNumOptions {
  min?: number;
  max?: number;
  exclusive?: boolean;
  integer?: boolean;
}

export class PurchaseService {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly supplierRepository: ISupplierRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll(
    query?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ) {
    return await this.purchaseRepository.findAll(query, status, limit, offset);
  }

  async findById(id: string) {
    const purchase = await this.purchaseRepository.findById(id);
    if (!purchase) throw new PurchaseNotFoundError();
    return purchase;
  }

  async create(input: CreatePurchaseInput): Promise<string> {
    if (!input.supplierId) throw new SupplierNotFoundError();
    await this.validateSupplier(input.supplierId);

    if (!input.items?.length) throw new EmptyPurchaseItemsError();
    if (input.items.length > 200) {
      throw new InvalidNumericValueError('items (máximo 200 por lote)');
    }
    await this.validateItems(input.items);

    const currency = this.validateCurrency(input.currency);
    const exchangeRate = this.parseNum(input.exchangeRate, 'exchangeRate', {
      min: 0,
      max: 1_000_000,
      exclusive: true,
    });
    const freight = this.parseNum(
      input.internationalFreight ?? 0,
      'internationalFreight',
      {
        min: 0,
        max: 1e9,
      },
    );
    const duties = this.parseNum(input.customsDuties ?? 0, 'customsDuties', {
      min: 0,
      max: 1e9,
    });

    const arrivalDate = this.parseDate(input.arrivalDate);
    const items = this.calculateItemCosts(
      input.items,
      exchangeRate,
      freight,
      duties,
    );

    return await this.purchaseRepository.create({
      supplierId: input.supplierId,
      arrivalDate,
      status: 'PENDING',
      currency,
      exchangeRate: exchangeRate.toFixed(4),
      internationalFreight: freight.toFixed(2),
      customsDuties: duties.toFixed(2),
      items,
    });
  }

  async update(input: UpdatePurchaseInput): Promise<void> {
    const existing = await this.getModifiablePurchase(input.id);
    if (input.supplierId !== undefined) {
      if (!input.supplierId) throw new SupplierNotFoundError();
      await this.validateSupplier(input.supplierId);
    }

    if (input.exchangeRate === null)
      throw new InvalidNumericValueError('exchangeRate');

    const exchangeRate =
      input.exchangeRate !== undefined
        ? this.parseNum(input.exchangeRate, 'exchangeRate', {
            min: 0,
            max: 1_000_000,
            exclusive: true,
          })
        : Number(existing.exchangeRate);

    const freight =
      input.internationalFreight !== undefined
        ? this.parseNum(input.internationalFreight ?? 0, 'internationalFreight', {
            min: 0,
            max: 1e9,
          })
        : Number(existing.internationalFreight);

    const duties =
      input.customsDuties !== undefined
        ? this.parseNum(input.customsDuties ?? 0, 'customsDuties', {
            min: 0,
            max: 1e9,
          })
        : Number(existing.customsDuties);

    let calculatedItems: CreatePurchaseItemData[] | undefined;

    if (input.items !== undefined) {
      if (!input.items.length) throw new EmptyPurchaseItemsError();
      if (input.items.length > 200) {
        throw new InvalidNumericValueError('items (máximo 200 por lote)');
      }
      await this.validateItems(input.items);
      calculatedItems = this.calculateItemCosts(
        input.items,
        exchangeRate,
        freight,
        duties,
      );
    } else if (
      input.exchangeRate !== undefined ||
      input.internationalFreight !== undefined ||
      input.customsDuties !== undefined
    ) {
      const current = existing.items.map((i) => ({
        productId: i.productId,
        quantityOrdered: i.quantityOrdered,
        unitCostForeign: i.unitCostForeign,
      }));
      calculatedItems = this.calculateItemCosts(
        current,
        exchangeRate,
        freight,
        duties,
      );
    }

    const arrivalDate =
      input.arrivalDate !== undefined
        ? this.parseDate(input.arrivalDate)
        : undefined;
    const currency =
      input.currency !== undefined
        ? this.validateCurrency(input.currency)
        : undefined;

    await this.purchaseRepository.update({
      id: input.id,
      supplierId: input.supplierId,
      arrivalDate,
      currency,
      exchangeRate: exchangeRate.toFixed(4),
      internationalFreight: freight.toFixed(2),
      customsDuties: duties.toFixed(2),
      items: calculatedItems,
    });
  }

  async cancel(id: string): Promise<void> {
    await this.getModifiablePurchase(id);
    await this.purchaseRepository.cancel(id);
  }

  async receive(input: ReceivePurchaseInput): Promise<void> {
    const existing = await this.getModifiablePurchase(input.id);

    if (input.items?.length) {
      const seen = new Set<string>();
      const validProductIds = new Set(existing.items.map((i) => i.productId));

      for (const item of input.items) {
        if (seen.has(item.productId)) throw new DuplicatePurchaseItemError();
        seen.add(item.productId);

        if (!validProductIds.has(item.productId)) {
          throw new ProductNotFoundError(item.productId);
        }
        this.parseNum(item.quantityReceived, 'quantityReceived', {
          min: 0,
          max: 1_000_000,
          integer: true,
        });
      }
    }

    const arrivalDate = input.arrivalDate
      ? this.parseDate(input.arrivalDate)
      : null;
    await this.purchaseRepository.receive(input.id, input.items, arrivalDate);
  }

  private async getModifiablePurchase(id: string) {
    const existing = await this.purchaseRepository.findById(id);
    if (!existing) throw new PurchaseNotFoundError();
    if (existing.status === 'RECEIVED')
      throw new PurchaseAlreadyReceivedError();
    if (existing.status === 'CANCELLED')
      throw new PurchaseAlreadyCancelledError();
    return existing;
  }

  private async validateSupplier(supplierId: string): Promise<void> {
    const supplier = await this.supplierRepository.findById(supplierId);
    if (!supplier?.active) throw new SupplierNotFoundError();
  }

  private validateCurrency(currency: unknown): string {
    if (typeof currency !== 'string')
      throw new InvalidNumericValueError('currency');
    const trimmed = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(trimmed))
      throw new InvalidNumericValueError('currency (formato ISO ej. JPY, USD)');
    return trimmed;
  }

  private parseDate(val: unknown): Date | null {
    if (val === null || val === undefined) return null;
    const d = new Date(val as string | number | Date);
    if (Number.isNaN(d.getTime()))
      throw new InvalidNumericValueError('arrivalDate');
    return d;
  }

  private parseNum(
    val: unknown,
    field: string,
    opts: ParseNumOptions = {},
  ): number {
    if (typeof val !== 'number' && typeof val !== 'string') {
      throw new InvalidNumericValueError(field);
    }
    const s = String(val).trim();
    if (!s || !/^-?\d+(\.\d+)?$/.test(s)) {
      throw new InvalidNumericValueError(field);
    }
    const num = Number(s);
    if (!Number.isFinite(num)) {
      throw new InvalidNumericValueError(field);
    }
    if (
      opts.min !== undefined &&
      (opts.exclusive ? num <= opts.min : num < opts.min)
    ) {
      throw new InvalidNumericValueError(field);
    }
    if (opts.max !== undefined && num > opts.max) {
      throw new InvalidNumericValueError(field);
    }
    if (opts.integer && !Number.isInteger(num)) {
      throw new InvalidNumericValueError(field);
    }
    return num;
  }

  private async validateItems(items: PurchaseItemInput[]): Promise<void> {
    const productIds = new Set<string>();

    for (const item of items) {
      if (productIds.has(item.productId))
        throw new DuplicatePurchaseItemError();
      productIds.add(item.productId);

      this.parseNum(item.quantityOrdered, 'quantityOrdered', {
        min: 1,
        max: 1_000_000,
        integer: true,
      });
      this.parseNum(item.unitCostForeign, 'unitCostForeign', {
        min: 0,
        max: 1e9,
      });
    }

    const activeIds = await this.productRepository.findActiveIds([
      ...productIds,
    ]);
    for (const id of productIds) {
      if (!activeIds.has(id)) throw new ProductNotFoundError(id);
    }
  }

  private calculateItemCosts(
    items: PurchaseItemInput[],
    exchangeRate: number,
    freight: number,
    duties: number,
  ): CreatePurchaseItemData[] {
    const totalAccessories = freight + duties;
    const withSubtotals = items.map((item) => {
      const qty = Number(item.quantityOrdered);
      const costPen = Number(item.unitCostForeign) * exchangeRate;
      return { item, qty, costPen, subtotalPen: costPen * qty };
    });

    const totalBasePen = withSubtotals.reduce(
      (sum, i) => sum + i.subtotalPen,
      0,
    );

    return withSubtotals.map(({ item, qty, costPen, subtotalPen }) => {
      const weight = totalBasePen > 0 ? subtotalPen / totalBasePen : 0;
      const unitAccessory = qty > 0 ? (totalAccessories * weight) / qty : 0;

      return {
        productId: item.productId,
        quantityOrdered: qty,
        unitCostForeign: Number(item.unitCostForeign).toFixed(2),
        unitCostPen: costPen.toFixed(2),
        unitLandedCost: (costPen + unitAccessory).toFixed(2),
      };
    });
  }
}
