import { InvalidFormatoNameError } from '../../domain/errors/formato.errors';
import type { IFormatoRepository, UpdateFormatoData } from '../port/formato.repository';

export interface AddFormatoInput {
  name: string;
  active: boolean;
}

export interface UpdateFormatoInput {
  id: string;
  name?: string;
  active?: boolean;
}

export class FormatoService {
  constructor(private readonly formatoRepository: IFormatoRepository) { }

  async findAll() {
    return await this.formatoRepository.findAll();
  }

  async create({ name, active }: AddFormatoInput) {
    const normalizedName = name.trim();

    if (!normalizedName || Array.from(normalizedName).length > 255) {
      throw new InvalidFormatoNameError();
    }

    return await this.formatoRepository.create({ name, active });
  }

  async update(input: UpdateFormatoInput) {
    const { id, ...data } = input;
    return await this.formatoRepository.update(id, data);
  }
}
