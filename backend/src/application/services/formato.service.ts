import { InvalidFormatoNameError } from '../../domain/errors/formato.errors';
import type { IFormatoRepository } from '../port/formato.repository';

interface AddFormatoInput {
  name: string;
  active: boolean;
}

interface UpdateFormatoInput {
  id: string;
  name?: string;
  active?: boolean;
}

export class FormatoService {
  constructor(private readonly formatoRepository: IFormatoRepository) { }

  async getAllFormatos() {
    return await this.formatoRepository.getAllFormatos();
  }

  async addFormato({ name, active }: AddFormatoInput) {
    const normalizedName = name.trim();

    if (!normalizedName || Array.from(normalizedName).length > 255) {
      throw new InvalidFormatoNameError();
    }

    return await this.formatoRepository.addFormato({ name, active });
  }

  async updateFormato(input: UpdateFormatoInput) {
    const { id, name, active } = input;

    if (name !== undefined) {
      const normalizedName = name.trim();

      if (!normalizedName || Array.from(normalizedName).length > 255) {
        throw new InvalidFormatoNameError();
      }
    }

    return await this.formatoRepository.updateFormato({ id, name, active });
  }
}
