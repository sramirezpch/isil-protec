import { InvalidFormatoNameError } from '../../domain/errors/formato.errors';
import type { IFormatoRepository } from '../port/formato.repository';

export class FormatoService {
  constructor(private readonly formatoRepository: IFormatoRepository) {}

  async getAllFormatos() {
    return await this.formatoRepository.getAllFormatos();
  }

  async addFormato(name: string) {
    const normalizedName = name.trim();

    if (!normalizedName || Array.from(normalizedName).length > 255) {
      throw new InvalidFormatoNameError();
    }

    return await this.formatoRepository.addFormato(normalizedName);
  }
}
