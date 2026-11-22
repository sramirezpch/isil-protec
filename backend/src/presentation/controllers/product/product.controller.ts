import type { Request, Response } from 'express';
import { generateLabelPdf } from '../../../application/services/label.service';
import type { ProductService } from '../../../application/services/product.service';
import { FranchiseNotFound } from '../../../domain/errors/franchise.errors';
import { LineaNotFound } from '../../../domain/errors/linea.errors';
import {
  ProductNotFound,
  ProductSkuAlreadyExistsError,
} from '../../../domain/errors/product.errors';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type {
  CreateProductBody,
  GenerateLabelQuery,
  GenerateSkuQuery,
  UpdateProductBody,
  UpdateProductParams,
} from './utils';

const MAX_LABELS = 100;

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query =
        typeof req.query.query === 'string' ? req.query.query : undefined;
      const products = await this.productService.findAll(query);

      return res.status(200).json(toResponseDto(true, { products }));
    } catch {
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al obtener figuras',
        }),
      );
    }
  };

  findById = async (
    req: Request<UpdateProductParams>,
    res: Response,
  ): Promise<Response> => {
    try {
      const product = await this.productService.findById(req.params.id);
      return res.status(200).json(toResponseDto(true, { product }));
    } catch (error) {
      if (error instanceof ProductNotFound) {
        return res
          .status(404)
          .json(toResponseDto(false, { message: error.message }));
      }
      return res
        .status(500)
        .json(
          toResponseDto(false, {
            message: 'Ocurrio un error al obtener la figura',
          }),
        );
    }
  };

  generateSku = async (
    req: Request<unknown, DtoResponse, unknown, GenerateSkuQuery>,
    res: Response,
  ): Promise<Response> => {
    const { franchiseId, lineaId, name } = req.query;

    if (!franchiseId || !lineaId || !name) {
      return res
        .status(400)
        .json(
          toResponseDto(false, {
            message: 'franchiseId, lineaId y name son requeridos',
          }),
        );
    }

    try {
      const sku = await this.productService.generateSku(
        franchiseId,
        lineaId,
        name,
      );
      return res.status(200).json(toResponseDto(true, { sku }));
    } catch (error) {
      if (
        error instanceof FranchiseNotFound ||
        error instanceof LineaNotFound
      ) {
        return res
          .status(400)
          .json(toResponseDto(false, { message: (error as Error).message }));
      }
      return res
        .status(500)
        .json(
          toResponseDto(false, {
            message: 'Ocurrio un error al generar el SKU',
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
      if (req.body.stock !== undefined && req.body.stock < 0) {
        return res.status(400).json(
          toResponseDto(false, {
            message: 'El stock no puede ser negativo',
          }),
        );
      }

      await this.productService.update({ id: req.params.id, ...req.body });

      return res
        .status(200)
        .json(
          toResponseDto(true, { message: 'Producto actualizado con exito' }),
        );
    } catch {
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al actualizar figura',
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
        .json(toResponseDto(true, { message: 'Producto archivado con exito' }));
    } catch {
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al eliminar figura',
        }),
      );
    }
  };

  generateLabel = async (
    req: Request<UpdateProductParams, unknown, unknown, GenerateLabelQuery>,
    res: Response,
  ) => {
    const rawQty = Number(req.query.quantity ?? '1');
    const quantity =
      Number.isInteger(rawQty) && rawQty >= 1
        ? Math.min(rawQty, MAX_LABELS)
        : 1;

    try {
      const product = await this.productService.findById(req.params.id);

      if (!product.sku) {
        return res
          .status(400)
          .json(
            toResponseDto(false, {
              message: 'La figura no tiene SKU asignado',
            }),
          );
      }

      const pdf = await generateLabelPdf(product.sku, product.name, quantity);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="etiquetas-${product.sku}.pdf"`,
      );
      res.setHeader('Content-Length', pdf.length);
      return res.end(pdf);
    } catch (error) {
      if (error instanceof ProductNotFound) {
        return res
          .status(404)
          .json(toResponseDto(false, { message: error.message }));
      }
      return res
        .status(500)
        .json(
          toResponseDto(false, {
            message: 'Ocurrio un error al generar las etiquetas',
          }),
        );
    }
  };
}
