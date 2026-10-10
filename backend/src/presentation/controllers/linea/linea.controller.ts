import type { Request, Response } from 'express';
import type { LineaService } from '../../../application/services/linea.service';
import { DtoResponse, toResponseDto } from '../../../utils';
import type { AddLineaBody, UpdateLineaBody, UpdateLineaParams } from './utils';

export class LineaController {
  constructor(private readonly lineaService: LineaService) { }

  findAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const lineas = await this.lineaService.findAll();
      return res.status(200).json(toResponseDto(true, { lineas }));
    } catch (error) {
      console.error('Error al obtener lineas:', error);
      return res.status(500).json(toResponseDto(false, { message: 'Ocurrió un error al obtener lineas' }));
    }
  }
}