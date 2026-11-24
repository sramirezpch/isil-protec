export class ArticleTypeAlreadyExists extends Error {
  constructor() {
    super('El tipo de artículo ya existe');
    this.name = 'ArticleTypeAlreadyExistsError';
  }
}

export class ArticleTypeNotFound extends Error {
  constructor() {
    super('No se ha encontrado un tipo de artículo con ese id');
    this.name = 'ArticleTypeNotFoundError';
  }
}