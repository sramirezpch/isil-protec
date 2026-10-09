import type { Formato } from '../../domain/entities/formato.entity';

export interface AddFormatoInput {
  name: string;
  active: boolean;
}

export interface IFormatoRepository {
  getAllFormatos(): Promise<Formato[]>;
  addFormato(input: AddFormatoInput): Promise<Formato>;
}
