import { ILineaRepository } from "../../../application/port/linea.repository";
import { Linea } from "../../../domain/entities/linea.entity";
import { db } from "../db/connection";
import { lineaTable } from "../db/schema/linea";
import { toDomain } from "../mappers/linea.mapper";

export class LineaRepository implements ILineaRepository {

  async findAll() {
    const lineas = await db.select().from(lineaTable);
    return lineas.map(toDomain)
  }
}