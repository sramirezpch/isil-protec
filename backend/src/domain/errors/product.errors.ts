export class ProductSkuAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe una figura con ese SKU');
    this.name = 'ProductSkuAlreadyExistsError';
  }
}
