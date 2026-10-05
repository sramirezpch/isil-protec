import { Request, Response } from 'express';
import { BrandService } from '../../application/services/BrandService';

interface CreateBrandDTO {
    name: string;
    active: boolean;
}

interface UpdateBrandDTO {
    name: string;
    active: boolean;
}

export class BrandController {
    constructor(private readonly brandService: BrandService) {}

    getAll = async (req: Request, res: Response): Promise<Response> => {
        try {
            const brands = await this.brandService.getAllBrands();
            return res.status(200).json({
                status: 200,
                data: { brand: brands }
            });
        } catch (error) {
            console.error('Error getting brands:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error al obtener las marcas'
            });
        }
    };

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { name, active } = req.body as CreateBrandDTO;

            if (!name || typeof active !== 'boolean') {
                return res.status(400).json({
                    status: 400,
                    message: 'Datos inválidos'
                });
            }

            await this.brandService.createBrand({ name, active });

            return res.status(200).json({
                status: 200,
                data: {
                    message: 'Marca creada con exito'
                }
            });
        } catch (error) {
            console.error('Error creating brand:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error al crear la marca'
            });
        }
    };

    update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const { name, active } = req.body as UpdateBrandDTO;

            if (!name || typeof active !== 'boolean') {
                return res.status(400).json({
                    status: 400,
                    message: 'Datos inválidos'
                });
            }

            await this.brandService.updateBrand(id, { name, active });

            return res.status(200).json({
                status: 200,
                data: {
                    message: 'Marca actualizada con exito'
                }
            });
        } catch (error) {
            console.error('Error updating brand:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error al actualizar la marca'
            });
        }
    };

    delete = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;

            await this.brandService.softDeleteBrand(id);

            return res.status(200).json({
                status: 200,
                data: {
                    message: 'Marca eliminada con exito'
                }
            });
        } catch (error) {
            console.error('Error deleting brand:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error al eliminar la marca'
            });
        }
    };
}