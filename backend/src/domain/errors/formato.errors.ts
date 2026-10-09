export class FormatoNameAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe un formato con ese nombre');
    this.name = 'FormatoNameAlreadyExistsError';
  }
}

export class InvalidFormatoNameError extends Error {
  constructor() {
    super('El nombre del formato debe tener entre 1 y 255 caracteres');
    this.name = 'InvalidFormatoNameError';
  }
}
