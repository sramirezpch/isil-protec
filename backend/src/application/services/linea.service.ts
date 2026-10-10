import type { ILineaRepository } from '../port/linea.repository';

export interface CreateLineaInput {
  name: string;
  brandId: string;
  active: boolean;
}

export interface UpdateLineaInput {
  id: string;
  name?: string;
  brandId?: string;
  active?: boolean;
}

export class LineaService {
  constructor(private readonly lineaRepository: ILineaRepository) {}

  async findAll() {
    return await this.lineaRepository.findAll();
  }

  async create(input: CreateLineaInput) {
    const noamlizedName = input.name.trim();
    if (!noamlizedName || Array.from(noamlizedName).length > 255) {
      throw new Error(
        'El nombre de la linea debe tener entre 1 y 255 caracteres',
      );
    }
    return await this.lineaRepository.create(input);
  }

  async update(input: UpdateLineaInput) {
    const { id, ...data } = input;
    return await this.lineaRepository.update(id, data);
  }

  async delete(id: string) {
    return await this.lineaRepository.delete(id);
  }
}
