import { ILineaRepository } from "../port/linea.repository";

export interface AppLineaInput {
  name: string;
  idmarca: string;
  active: boolean;
}

export interface UpdateLineaInput {
  id: string;
  name?: string;
  idmarca?: string;
  active?: boolean;
}

export class LineaService {
  constructor(private readonly lineaRepository: ILineaRepository) { }

  async findAll() {
    return await this.lineaRepository.findAll();
  }
}