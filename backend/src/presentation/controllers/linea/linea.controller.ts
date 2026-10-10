import type { Request, Response } from 'express';
import type { LineaService } from '../../../application/services/linea.service';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type { CreateLineaBody, UpdateLineaBody, UpdateLineaParams } from './utils';

export class LineaController {
  constructor(private readonly lineaService: LineaService) {}

  findAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const lineas = await this.lineaService.findAll();
      return res.status(200).json(toResponseDto(true, { lineas }));
    } catch (error) {
      console.error('Error al obtener lineas:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al obtener lineas',
        }),
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateLineaBody>,
    res: Response,
  ) => {
    try {
      const { name, brandId, active } = req.body;
      await this.lineaService.create({ name, brandId, active });
      return res
        .status(201)
        .json(toResponseDto(true, { message: 'Linea creada exitosamente' }));
    } catch (error) {
      console.error('Error al crear linea:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al crear la linea',
        }),
      );
    }
  };

  update = async (
    req: Request<UpdateLineaParams, DtoResponse, UpdateLineaBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      const { name, brandId, active } = req.body;
      await this.lineaService.update({ id, name, brandId, active });
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Linea actualizada con exito' }));
    } catch (error) {
      console.error('Error al actualizar linea:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al actualizar la linea',
        }),
      );
    }
  };

  delete = async (
    req: Request<UpdateLineaParams, DtoResponse, null>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      await this.lineaService.delete(id);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Linea eliminada exitosamente' }));
    } catch (error) {
      console.error('Error al eliminar linea:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al eliminar la linea',
        }),
      );
    }
  };
}
