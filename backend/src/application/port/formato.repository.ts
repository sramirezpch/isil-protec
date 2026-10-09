import type { Formato } from '../../domain/entities/formato.entity';

export type UpdateFormatoData = Partial<Pick<Formato, 'name' | 'active'>>;

export type AddFormatoInput = {
  name: string;
  active: boolean;
}

export interface IFormatoRepository {
  findAll(): Promise<Formato[]>;
  create(data: AddFormatoInput): Promise<void>;
  update(id: string, data: UpdateFormatoData): Promise<void>;
  delete(id: string): Promise<void>;
}
