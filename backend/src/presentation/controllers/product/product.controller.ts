import { Request, Response } from 'express';
import { ProductService } from '../../../application/services/product.service';
import { DtoResponse, toResponseDto } from '../../../utils';
import {
    CreateProductBody,
    UpdateProductBody,
    UpdateProductParams,
} from './utils';
import { FranchiseNotFound } from '../../../domain/errors/franchise.errors';
import { LineaNotFound } from '../../../domain/errors/linea.errors';
import { ProductSkuAlreadyExistsError } from '../../../domain/errors/product.errors';

export class ProductController {
    constructor(private readonly productService: ProductService) { }

    findAll = async (req: Request, res: Response): Promise<Response> => {
        try {
            const query = typeof req.query.query === 'string' ? req.query.query : undefined;
            const products = await this.productService.findAll(query);

            return res.status(200).json(toResponseDto(true, { products }));
        } catch (error) {
            console.error('Error al obtener productos:', error);
            return res.status(500).json(
                toResponseDto(false, {
                    message: 'Ocurrio un error al obtener figuras',
                }),
            );
        }
    };

    create = async (
        req: Request<null, DtoResponse, CreateProductBody>,
        res: Response,
    ) => {
        try {
            await this.productService.create(req.body);

            return res
                .status(201)
                .json(toResponseDto(true, { message: 'Producto creado con exito' }));
        } catch (error) {
            console.error('Error al obtener productos:', error);

            let message = 'Ocurrio un error al crear figura';
            let status = 500;

            if (error instanceof FranchiseNotFound) {
                message = error.message;
                status = 400;
            } else if (error instanceof LineaNotFound) {
                message = error.message;
                status = 400;
            } else if (error instanceof ProductSkuAlreadyExistsError) {
                message = error.message;
                status = 409;
            }

            return res.status(status).json(
                toResponseDto(false, {
                    message,
                }),
            );
        }
    };

    update = async (
        req: Request<UpdateProductParams, DtoResponse, UpdateProductBody>,
        res: Response,
    ) => {
        try {
            await this.productService.update({ id: req.params.id, ...req.body });

            return res
                .status(200)
                .json(
                    toResponseDto(true, { message: 'Producto actualizado con exito' }),
                );
        } catch (error) {
            console.error('Error al obtener productos:', error);

            let message = 'Ocurrio un error al actualizar figura';
            let status = 500;

            if (error instanceof ProductSkuAlreadyExistsError) {
                message = error.message;
                status = 409;
            }

            return res.status(status).json(
                toResponseDto(false, {
                    message,
                }),
            );
        }
    };

    delete = async (
        req: Request<UpdateProductParams, DtoResponse, null>,
        res: Response,
    ) => {
        try {
            await this.productService.delete(req.params.id);

            return res
                .status(200)
                .json(
                    toResponseDto(true, { message: 'Producto actualizado con exito' }),
                );
        } catch (error) {
            console.error('Error al obtener productos:', error);
            return res.status(500).json(
                toResponseDto(false, {
                    message: 'Ocurrio un error al eliminar figura',
                }),
            );
        }
    };
}
