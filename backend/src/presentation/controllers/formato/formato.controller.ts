import type { Request, Response } from 'express';
import type { FormatoService } from '../../../application/services/formato.service';
import { FormatoNameAlreadyExistsError, InvalidFormatoNameError } from '../../../domain/errors/formato.errors';
import { toResponseDto } from '../../../utils';

interface AddFormatoBody {
  name: string;
  active: boolean;
}

export class FormatoController {
  constructor(private readonly formatoService: FormatoService) { }

  getAllFormatos = async (_req: Request, res: Response): Promise<Response> => {
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

  addFormato = async (
    req: Request<null, unknown, AddFormatoBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const { name, active } = req.body;

      const formato = await this.formatoService.addFormato({ name, active });
      return res.status(201).json(toResponseDto(true, { message: 'Formato creado exitosamente' }));
    } catch (error) {
      if (error instanceof InvalidFormatoNameError) {
        return res
          .status(400)
          .json(toResponseDto(false, { message: error.message }));
      }

      if (error instanceof FormatoNameAlreadyExistsError) {
        return res
          .status(409)
          .json(toResponseDto(false, { message: error.message }));
      }

      console.error('Error al crear formato:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al crear el formato',
        }),
      );
    }
  };
}
