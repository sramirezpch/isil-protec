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
