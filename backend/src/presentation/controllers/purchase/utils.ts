import { validate as isValidUuid } from 'uuid';
import { InvalidNumericValueError } from '../../../domain/errors/purchase.errors';

export interface PurchaseItemBody {
  productId: string;
  quantityOrdered: number;
  unitCostForeign: number | string;
}

export interface CreatePurchaseBody {
  supplierId: string;
  arrivalDate?: string | null;
  currency: string;
  exchangeRate: number | string;
  internationalFreight?: number | string;
  customsDuties?: number | string;
  items: PurchaseItemBody[];
}

export interface PurchaseIdParams {
  id: string;
}

export interface UpdatePurchaseStatusBody {
  status: 'PENDING';
}

export interface UpdatePurchaseBody {
  supplierId?: string;
  arrivalDate?: string | null;
  currency?: string;
  exchangeRate?: number | string;
  internationalFreight?: number | string;
  customsDuties?: number | string;
  items?: PurchaseItemBody[];
}

export interface ReceiveItemBody {
  productId: string;
  quantityReceived: number;
}

export interface ReceivePurchaseBody {
  arrivalDate?: string | null;
  items?: ReceiveItemBody[];
}

export const validateUuid = (id: unknown, fieldName: string): string => {
  if (typeof id !== 'string' || !isValidUuid(id)) {
    throw new InvalidNumericValueError(
      `${fieldName} (debe ser un UUID válido)`,
    );
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
