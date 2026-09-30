import { Request, Response } from 'express';
import { FormatoService } from '../../application/services/formatoService';

export class FormatoController {
  constructor(private readonly formatoService: FormatoService) {}

  getAllFormatos = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formatos = await this.formatoService.getAllFormatos();
      return res.status(200).json({
        success: true,
        message: 'Formatos obtenidos exitosamente',
        data: formatos
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los formatos',
        error
      });
    }
  };
}
