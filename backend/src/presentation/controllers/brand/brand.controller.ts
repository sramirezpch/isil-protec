import type { Request, Response } from 'express';
import type { BrandService } from '../../../application/services/brand-service';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type { CreateBrandBody, DeleteBrandParams, UpdateBrandBody, UpdateBrandParams } from './utils';

export class BrandController {
  constructor(private readonly brandService: BrandService) { }

  getAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const brands = await this.brandService.getAllBrands();

      return res.status(200).json(toResponseDto(true, { brands }));
    } catch (error) {
      console.error('Error getting brands:', error);
      return res
        .status(500)
        .json(toResponseDto(false, { message: 'Error al obtener las marcas' }));
    }
  };

  updateById = async (
    req: Request<UpdateBrandParams, DtoResponse, UpdateBrandBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      const { name, active } = req.body;

      await this.brandService.updateBrand({ id, name, active });

      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Se actualizo la marca' }));
    } catch (error) {
      console.error('Error updating brand:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al actualizar marca',
        }),
      );
    }
  };

  create = async (req: Request<null, DtoResponse, CreateBrandBody>, res: Response) => {
    try {
      const { name, active } = req.body;

      await this.brandService.create({ name, active });

      return res.status(200).json(toResponseDto(true, { message: "Marca creada con exito" }))
    } catch (error) {
      console.error("Error creating brand:", error);

      return res.status(500).json(toResponseDto(false, { message: "Ocurrio un error al crear marca" }))
    }
  }

  delete = async (req: Request<DeleteBrandParams, DtoResponse, null>, res: Response) => {
    try {
      const { id } = req.params;

      await this.brandService.delete(id);

      return res.status(200).json(toResponseDto(true, { message: "Marca eliminada con éxito" }))
    } catch (error) {
      console.error("Error deleting brand:", error);

      return res.status(500).json(toResponseDto(false, { message: "Ocurrio un error al eliminar marca" }))
    }
  }
}
