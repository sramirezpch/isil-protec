import type { Formato } from '../../domain/entities/formato.entity';

export interface IFormatoRepository {
  getAllFormatos(): Promise<Formato[]>;
  addFormato(name: string): Promise<Formato>;
}
