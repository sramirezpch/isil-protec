import { validate as isValidUuid } from 'uuid';
import { SaleInvalidFieldError } from '../../../domain/errors/sale.errors';

export interface SaleItemBody {
  productId: string;
  quantity: number;
  unitPrice: number | string;
}

export interface CreateSaleBody {
  clientId: string;
  saleDate?: string | null;
  items: SaleItemBody[];
}

export interface SaleIdParams {
  id: string;
}

export interface UpdateSaleStatusBody {
  status: 'PENDING_PAYMENT' | 'PENDING_DELIVERY' | 'DELIVERED';
}

export const validateUuid = (id: unknown, fieldName: string): string => {
  if (typeof id !== 'string' || !isValidUuid(id)) {
    throw new SaleInvalidFieldError(`${fieldName} (debe ser un UUID válido)`);
  }
  return id;
};

export const sanitizeString = (
  val: unknown,
  maxLength = 100,
): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
};
