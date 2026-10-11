export class LineaNotFound extends Error {
  constructor() {
    super('No se ha encontrado una linea con ese id');
    this.name = 'LineaNotFoundError';
  }
}
