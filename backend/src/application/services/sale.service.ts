import {
  ClientNotFoundError,
  DuplicateSaleItemError,
  EmptySaleItemsError,
  InsufficientStockError,
  SaleCannotBeCancelledError,
  SaleCannotBeEditedError,
  SaleInvalidFieldError,
  SaleNotFoundError,
  SaleProductNotFoundError,
} from '../../domain/errors/sale.errors';
import type { IClientRepository } from '../port/client.repository';
import type { IProductRepository } from '../port/product.repository';
import type {
  CreateSaleData,
  ISaleRepository,
} from '../port/sale.repository';

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number | string;
}

export interface CreateSaleInput {
  clientId: string;
  saleDate?: string | Date | null;
  items: SaleItemInput[];
}

export interface UpdateSaleStatusInput {
  id: string;
  status: 'PENDING_PAYMENT' | 'PENDING_DELIVERY' | 'DELIVERED';
}

interface ParseNumOptions {
  min?: number;
  max?: number;
  exclusive?: boolean;
  integer?: boolean;
}

export class SaleService {
  constructor(
    private readonly saleRepository: ISaleRepository,
    private readonly clientRepository: IClientRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll(query?: string, status?: string, limit?: number, offset?: number) {
    return await this.saleRepository.findAll(query, status, limit, offset);
  }

  async findById(id: string) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) throw new SaleNotFoundError();
    return sale;
  }

  async create(input: CreateSaleInput): Promise<string> {
    const data = await this.buildSaleData(input);
    return await this.saleRepository.create(data);
  }

  async update(id: string, input: CreateSaleInput): Promise<void> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) throw new SaleNotFoundError();
    if (existing.status !== 'PENDING_PAYMENT') {
      throw new SaleCannotBeEditedError();
    }

    const data = await this.buildSaleData(input, existing.saleDate);
    await this.saleRepository.update(id, data);
  }

  private async buildSaleData(
    input: CreateSaleInput,
    defaultSaleDate?: Date,
  ): Promise<CreateSaleData> {
    if (!input.clientId) throw new ClientNotFoundError();
    await this.validateClient(input.clientId);

    if (!input.items?.length) throw new EmptySaleItemsError();
    if (input.items.length > 200) {
      throw new SaleInvalidFieldError('items (máximo 200 por venta)');
    }

    const saleDate =
      this.parseDate(input.saleDate) ?? defaultSaleDate ?? new Date();

    const { items, totalAmount } = await this.buildItems(input.items);

    return {
      clientId: input.clientId,
      totalAmount: totalAmount.toFixed(2),
      saleDate,
      items,
    };
  }

  async updateStatus(input: UpdateSaleStatusInput): Promise<void> {
    const existing = await this.saleRepository.findById(input.id);
    if (!existing) throw new SaleNotFoundError();

    const validTransitions: Record<string, string[]> = {
      CANCELLED: ['PENDING_PAYMENT'],
      PENDING_PAYMENT: ['PENDING_DELIVERY'],
      PENDING_DELIVERY: ['DELIVERED'],
    };

    const allowed = validTransitions[existing.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new SaleCannotBeCancelledError();
    }

    await this.saleRepository.updateStatus(input.id, input.status);
  }

  async cancel(id: string): Promise<void> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) throw new SaleNotFoundError();

    if (existing.status !== 'PENDING_PAYMENT') {
      throw new SaleCannotBeCancelledError();
    }

    await this.saleRepository.cancel(id);
  }

  private async validateClient(clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client || !client.active) throw new ClientNotFoundError();
  }

  private parseDate(val: unknown): Date | null {
    if (val === null || val === undefined) return null;
    const d = new Date(val as string | number | Date);
    if (Number.isNaN(d.getTime())) throw new SaleInvalidFieldError('saleDate');
    return d;
  }

  private parseNum(val: unknown, field: string, opts: ParseNumOptions = {}): number {
    if (typeof val !== 'number' && typeof val !== 'string') {
      throw new SaleInvalidFieldError(field);
    }
    const s = String(val).trim();
    if (!s || !/^-?\d+(\.\d+)?$/.test(s)) {
      throw new SaleInvalidFieldError(field);
    }
    const num = Number(s);
    if (!Number.isFinite(num)) throw new SaleInvalidFieldError(field);
    if (opts.min !== undefined && (opts.exclusive ? num <= opts.min : num < opts.min)) {
      throw new SaleInvalidFieldError(field);
    }
    if (opts.max !== undefined && num > opts.max) throw new SaleInvalidFieldError(field);
    if (opts.integer && !Number.isInteger(num)) throw new SaleInvalidFieldError(field);
    return num;
  }

  private async buildItems(rawItems: SaleItemInput[]) {
    const productIds = new Set<string>();

    for (const item of rawItems) {
      if (productIds.has(item.productId)) throw new DuplicateSaleItemError();
      productIds.add(item.productId);

      this.parseNum(item.quantity, 'quantity', { min: 1, max: 1_000_000, integer: true });
      this.parseNum(item.unitPrice, 'unitPrice', { min: 0, max: 1e9, exclusive: true });
    }

    // Verify all products are active
    const activeIds = await this.productRepository.findActiveIds([...productIds]);
    for (const id of productIds) {
      if (!activeIds.has(id)) throw new SaleProductNotFoundError(id);
    }

    // Verify stock for each product
    for (const item of rawItems) {
      const product = await this.productRepository.findById(item.productId);
      const qty = Number(item.quantity);
      if (product && product.stock < qty) {
        throw new InsufficientStockError(
          `${product.name} (disponible: ${product.stock}, solicitado: ${qty})`,
        );
      }
    }

    let totalAmount = 0;
    const items = rawItems.map((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const subtotal = qty * price;
      totalAmount += subtotal;
      return {
        productId: item.productId,
        quantity: qty,
        unitPrice: price.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    });

    return { items, totalAmount };
  }
}
