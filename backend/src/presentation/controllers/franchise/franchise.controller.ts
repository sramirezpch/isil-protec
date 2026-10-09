import type { Request, Response } from 'express';
import type { FranchiseService } from '../../../application/services/franchise.service';
import { toResponseDto } from '../../../utils';

interface CreateFranchiseBody {
  name: string;
  active: boolean;
}

interface UpdateFranchiseBody {
  name?: string;
  active?: boolean;
}

interface UpdateFranchiseParams {
  id: string;
}

interface DeleteFranchiseParams {
  id: string;
}

export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) { }

  getAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const franchises = await this.franchiseService.getAllFranchises();
      return res.status(200).json(toResponseDto(true, { franchises }));
    } catch (error) {
      console.error('Error getting franchises:', error);
      return res.status(500).json(
        toResponseDto(false, { message: 'Error al obtener las franquicias' })
      );
    }
  };

  updateById = async (
    req: Request<UpdateFranchiseParams, unknown, UpdateFranchiseBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      const { name, active } = req.body;

      await this.franchiseService.updateFranchise({ id, name, active });

      return res.status(200).json(
        toResponseDto(true, { message: 'Franquicia actualizada con exito' })
      );
    } catch (error) {
      console.error('Error updating franchise:', error);
      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrio un error al actualizar franquicia' })
      );
    }
  };

  create = async (
    req: Request<null, unknown, CreateFranchiseBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const { name, active } = req.body;

      await this.franchiseService.create({ name, active });

      return res.status(200).json(
        toResponseDto(true, { message: 'Franquicia creada con exito' })
      );
    } catch (error) {
      console.error('Error creating franchise:', error);
      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrio un error al crear franquicia' })
      );
    }
  };

  delete = async (
    req: Request<DeleteFranchiseParams, unknown, null>,
    res: Response,
  ): Promise<Response> => {
    try {
      const { id } = req.params;

      await this.franchiseService.delete(id);

      return res.status(200).json(
        toResponseDto(true, { message: 'Franquicia eliminada con éxito' })
      );
    } catch (error) {
      console.error('Error deleting franchise:', error);
      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrio un error al eliminar franquicia' })
      );
    }
  };
}