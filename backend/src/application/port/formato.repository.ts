import { Formato } from "../../domain/entities/formato.entity";

export interface IFormatoRepository {
    getAllFormatos(): Promise<Formato[]>;
}
