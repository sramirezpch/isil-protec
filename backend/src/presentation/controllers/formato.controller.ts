import type { Request, Response } from 'express';
import type { FormatoService } from '../../application/services/formato.service';
import type { DtoResponse } from './utils';

const toResponseDto = (
  success: boolean,
  data: Record<string, unknown>,
): DtoResponse => {
  return {
    success,
    data,
  };
};

export class FormatoController {
  constructor(private readonly formatoService: FormatoService) {}

  getAllFormatos = async (req: Request, res: Response): Promise<Response> => {
    try {
      const formatos = await this.formatoService.getAllFormatos();
      return res.status(200).json(toResponseDto(true, { formatos }));
    } catch (error) {
      console.log('Error al obtener formatos:', error);

      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al obtener formatos',
        }),
      );
    }
  };
}
