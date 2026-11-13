export class ProductSkuAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe una figura con ese SKU');
    this.name = 'ProductSkuAlreadyExistsError';
  }
}

export class ProductNotFound extends Error {
  constructor() {
    super('Figura no encontrada');
    this.name = 'ProductNotFound';
  }
}
