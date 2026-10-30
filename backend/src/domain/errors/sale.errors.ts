export class SaleNotFoundError extends Error {
  constructor() {
    super('No se encontró la venta especificada');
    this.name = 'SaleNotFoundError';
  }
}

export class ClientNotFoundError extends Error {
  constructor() {
    super('El cliente especificado no existe o no se encuentra activo');
    this.name = 'ClientNotFoundError';
  }
}

export class SaleProductNotFoundError extends Error {
  constructor(details?: string) {
    super(
      details
        ? `Producto no válido o inactivo: ${details}`
        : 'Uno o más productos especificados no existen o se encuentran inactivos',
    );
    this.name = 'SaleProductNotFoundError';
  }
}

export class EmptySaleItemsError extends Error {
  constructor() {
    super('La venta debe contener al menos un producto');
    this.name = 'EmptySaleItemsError';
  }
}

export class DuplicateSaleItemError extends Error {
  constructor() {
    super('No se puede incluir el mismo producto más de una vez en la venta');
    this.name = 'DuplicateSaleItemError';
  }
}

export class SaleAlreadyCancelledError extends Error {
  constructor() {
    super('No se puede modificar una venta que ha sido cancelada');
    this.name = 'SaleAlreadyCancelledError';
  }
}

export class SaleCannotBeCancelledError extends Error {
  constructor() {
    super('Solo se puede cancelar una venta que esté pendiente de pago');
    this.name = 'SaleCannotBeCancelledError';
  }
}

export class SaleCannotBeEditedError extends Error {
  constructor() {
    super('Solo se puede editar una venta que esté pendiente de pago');
    this.name = 'SaleCannotBeEditedError';
  }
}

export class SaleStateConflictError extends Error {
  constructor() {
    super(
      'Conflicto de concurrencia: la venta no existe o su estado ya ha sido modificado por otra operación',
    );
    this.name = 'SaleStateConflictError';
  }
}

export class SaleInvalidStatusTransitionError extends Error {
  constructor() {
    super('La transición de estado solicitada no es válida para esta venta');
    this.name = 'SaleInvalidStatusTransitionError';
  }
}

export class SaleInvalidFieldError extends Error {
  constructor(field: string) {
    super(`El valor de '${field}' no es válido`);
    this.name = 'SaleInvalidFieldError';
  }
}

export class InsufficientStockError extends Error {
  constructor(details?: string) {
    super(
      details
        ? `Stock insuficiente para el producto: ${details}`
        : 'Stock insuficiente para uno o más productos de la venta',
    );
    this.name = 'InsufficientStockError';
  }
}
