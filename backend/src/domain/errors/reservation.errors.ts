export class ReservationClientNotFoundError extends Error {
  constructor() {
    super('El cliente especificado no existe o no se encuentra activo');
    this.name = 'ReservationClientNotFoundError';
  }
}

export class EmptyReservationItemsError extends Error {
  constructor() {
    super('La reserva debe contener al menos una figura');
    this.name = 'EmptyReservationItemsError';
  }
}

export class DuplicateReservationItemError extends Error {
  constructor() {
    super('No se puede incluir la misma figura más de una vez en la reserva');
    this.name = 'DuplicateReservationItemError';
  }
}

export class ReservationProductNotFoundError extends Error {
  constructor(details?: string) {
    super(
      details
        ? `Figura no válida o inactiva: ${details}`
        : 'Una o más figuras no existen o se encuentran inactivas',
    );
    this.name = 'ReservationProductNotFoundError';
  }
}

export class ReservationDeadlineInvalidError extends Error {
  constructor() {
    super('Debe indicar una fecha límite válida, igual o posterior a hoy');
    this.name = 'ReservationDeadlineInvalidError';
  }
}

export class ReservationInvalidFieldError extends Error {
  constructor(field: string) {
    super(`El valor de '${field}' no es válido`);
    this.name = 'ReservationInvalidFieldError';
  }
}

export class ReservationPriceChangedError extends Error {
  constructor() {
    super(
      'El precio de una figura cambió; revise la reserva e intente nuevamente',
    );
    this.name = 'ReservationPriceChangedError';
  }
}

export class ReservationNotFoundError extends Error {
  constructor() {
    super('No se encontró la reserva especificada');
    this.name = 'ReservationNotFoundError';
  }
}

export class ReservationPaymentAmountInvalidError extends Error {
  constructor() {
    super('El monto del abono debe ser mayor a cero');
    this.name = 'ReservationPaymentAmountInvalidError';
  }
}

export class ReservationPaymentMethodInvalidError extends Error {
  constructor() {
    super('El medio de pago no es válido');
    this.name = 'ReservationPaymentMethodInvalidError';
  }
}

export class ReservationNotVigenteError extends Error {
  constructor() {
    super('Solo se pueden registrar abonos para reservas vigentes');
    this.name = 'ReservationNotVigenteError';
  }
}

export class AbonoExcedeSaldoError extends Error {
  constructor() {
    super('El monto ingresado excede el saldo pendiente');
    this.name = 'AbonoExcedeSaldoError';
  }
}

export class ReservationAlreadyCancelledError extends Error {
  constructor() {
    super('La reserva ya fue cancelada');
    this.name = 'ReservationAlreadyCancelledError';
  }
}

export class ReservationCannotBeCancelledError extends Error {
  constructor() {
    super('La reserva no se encuentra vigente y no puede cancelarse');
    this.name = 'ReservationCannotBeCancelledError';
  }
}

export class ReservationConvertedCannotBeCancelledError extends Error {
  constructor() {
    super(
      'Una reserva convertida no puede cancelarse porque su venta ya existe',
    );
    this.name = 'ReservationConvertedCannotBeCancelledError';
  }
}

export class ReservationCannotBeConvertedError extends Error {
  constructor() {
    super('Una reserva cancelada no puede reactivarse como venta');
    this.name = 'ReservationCannotBeConvertedError';
  }
}

export class ReservationAlreadyConvertedError extends Error {
  constructor() {
    super('La reserva ya fue convertida en venta');
    this.name = 'ReservationAlreadyConvertedError';
  }
}

export class ReservationConversionStockInsufficientError extends Error {
  constructor(figureName: string, available: number, requested: number) {
    super(
      `Stock insuficiente para convertir ${figureName} (disponible: ${available}, solicitado: ${requested})`,
    );
    this.name = 'ReservationConversionStockInsufficientError';
  }
}

export class ReservationPaymentMethodRequiredError extends Error {
  constructor() {
    super('Debe indicar un medio de pago para liquidar el saldo pendiente');
    this.name = 'ReservationPaymentMethodRequiredError';
  }
}

export class ReservationPaymentBalanceInvalidError extends Error {
  constructor() {
    super('Los abonos registrados superan el total de la reserva');
    this.name = 'ReservationPaymentBalanceInvalidError';
  }
}

export class ReservationCancellationReasonInvalidError extends Error {
  constructor() {
    super(
      'El motivo de cancelación es obligatorio y no debe exceder 500 caracteres',
    );
    this.name = 'ReservationCancellationReasonInvalidError';
  }
}

export class ReservationCancellationConfirmationRequiredError extends Error {
  constructor(public readonly totalPaid: string) {
    super(
      `La reserva tiene S/ ${totalPaid} abonados. Confirme para cancelar; el dinero no se devolverá automáticamente`,
    );
    this.name = 'ReservationCancellationConfirmationRequiredError';
  }
}
