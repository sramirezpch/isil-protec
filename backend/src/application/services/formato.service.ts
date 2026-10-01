import type { IFormatoRepository } from '../port/formato.repository';

export class FormatoService {
  constructor(private readonly formatoRepository: IFormatoRepository) {}

  async getAllFormatos() {
    return await this.formatoRepository.getAllFormatos();
  }
}
