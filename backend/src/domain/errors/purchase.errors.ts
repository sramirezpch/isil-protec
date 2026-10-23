export class PurchaseNotFoundError extends Error {
  constructor() {
    super('No se encontró la compra especificada');
    this.name = 'PurchaseNotFoundError';
  }
}

export class SupplierNotFoundError extends Error {
  constructor() {
    super('El proveedor especificado no existe o no se encuentra activo');
    this.name = 'SupplierNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(details?: string) {
    super(
      details
        ? `Producto no válido o inactivo: ${details}`
        : 'Uno o más productos especificados no existen o se encuentran inactivos',
    );
    this.name = 'ProductNotFoundError';
  }
}

export class EmptyPurchaseItemsError extends Error {
  constructor() {
    super('La compra debe contener al menos un producto');
    this.name = 'EmptyPurchaseItemsError';
  }
}

export class DuplicatePurchaseItemError extends Error {
  constructor() {
    super('No se puede incluir el mismo producto más de una vez en el lote');
    this.name = 'DuplicatePurchaseItemError';
  }
}

export class PurchaseAlreadyReceivedError extends Error {
  constructor() {
    super(
      'No se puede modificar ni cancelar una compra que ya ha sido recibida',
    );
    this.name = 'PurchaseAlreadyReceivedError';
  }
}

export class PurchaseAlreadyCancelledError extends Error {
  constructor() {
    super('No se puede modificar ni recibir una compra que ha sido cancelada');
    this.name = 'PurchaseAlreadyCancelledError';
  }
}

export class PurchaseStateConflictError extends Error {
  constructor() {
    super(
      'Conflicto de concurrencia: la compra no existe o su estado ya ha sido modificado por otra operación',
    );
    this.name = 'PurchaseStateConflictError';
  }
}

export class InvalidNumericValueError extends Error {
  constructor(field: string) {
    super(`El valor de '${field}' no es válido`);
    this.name = 'InvalidNumericValueError';
  }
}
