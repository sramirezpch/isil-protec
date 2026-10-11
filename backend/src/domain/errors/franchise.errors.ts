export class FranchiseNotFound extends Error {
  constructor() {
    super('No se ha encontrado una franquicia con ese id');
    this.name = 'FranchiseNotFoundError';
  }
}
