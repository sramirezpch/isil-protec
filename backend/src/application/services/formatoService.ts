import { FormatoRepository } from "../../infrastructure/postgres/repository/formatoRepository";

export class FormatoService {
    constructor(private readonly formatoRepository: FormatoRepository) {}

    async getAllFormatos() {
        return await this.formatoRepository.getAllFormatos();
    }
}