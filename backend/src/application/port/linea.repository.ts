import type { Linea } from '../../domain/entities/linea.entity';

export type UpdateLineaData = Partial<
  Pick<Linea, 'name' | 'brandId' | 'active'>
>;

export type CreateLineaInput = {
  name: string;
  brandId: string;
  active: boolean;
};

export type LineaListItem = {
  id: string;
  name: string;
  brandName: string;
  active: boolean;
};

export interface ILineaRepository {
  findAll(): Promise<LineaListItem[]>;
  create(data: CreateLineaInput): Promise<void>;
  update(id: string, data: UpdateLineaData): Promise<void>;
  delete(id: string): Promise<void>;
}
