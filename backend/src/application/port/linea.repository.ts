import type { Linea } from '../../domain/entities/linea.entity';

export type UpdateLineaData = Partial<Pick<Linea, 'name' | 'idmarca' | 'active'>>;

export type AddLineaInput = {
  name: string;
  idmarca: string;
  active: boolean;
}

export interface ILineaRepository {
  findAll(): Promise<Linea[]>;
}