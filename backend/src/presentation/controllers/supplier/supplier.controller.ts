import type { Request, Response } from 'express';
import {
  type SupplierService,
  SupplierTaxIdError,
} from '../../../application/services/supplier.service';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type {
  CreateSupplierBody,
  UpdateSupplierBody,
  UpdateSupplierParams,
  ValidateTaxIdBody,
} from './utils';

export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query =
        typeof req.query.query === 'string' ? req.query.query : undefined;
      const suppliers = await this.supplierService.findAll(query);
      return res.status(200).json(toResponseDto(true, { suppliers }));
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al obtener proveedores',
        }),
      );
    }
  };

  validateTaxId = async (
    req: Request<null, DtoResponse, ValidateTaxIdBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const { country, taxId } = req.body ?? {};
      if (typeof country !== 'string' || typeof taxId !== 'string') {
        return res.status(400).json(
          toResponseDto(false, {
            message: 'El país y el Tax ID son obligatorios',
          }),
        );
      }

      const result = await this.supplierService.validateTaxId({
        country,
        taxId,
      });
      return res.status(200).json(
        toResponseDto(true, {
          companyName: result.companyName,
          address: result.address,
        }),
      );
    } catch (error) {
      if (error instanceof SupplierTaxIdError) {
        return res
          .status(error.statusCode)
          .json(toResponseDto(false, { message: error.message }));
      }
      console.error('Error al validar Tax ID:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al validar el Tax ID',
        }),
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateSupplierBody>,
    res: Response,
  ) => {
    if (
      typeof req.body?.country !== 'string' ||
      typeof req.body?.taxId !== 'string'
    ) {
      return res.status(400).json(
        toResponseDto(false, {
          message: 'El país y el Tax ID son obligatorios',
        }),
      );
    }

    try {
      await this.supplierService.create(req.body);
      return res
        .status(201)
        .json(toResponseDto(true, { message: 'Proveedor creado con exito' }));
    } catch (error) {
      if (error instanceof SupplierTaxIdError) {
        return res
          .status(error.statusCode)
          .json(toResponseDto(false, { message: error.message }));
      }
      console.error('Error al crear proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al crear proveedor',
        }),
      );
    }
  };

  update = async (
    req: Request<UpdateSupplierParams, DtoResponse, UpdateSupplierBody>,
    res: Response,
  ) => {
    if (
      (req.body?.country !== undefined &&
        typeof req.body.country !== 'string') ||
      (req.body?.taxId !== undefined && typeof req.body.taxId !== 'string')
    ) {
      return res.status(400).json(
        toResponseDto(false, {
          message: 'El país y el Tax ID deben ser cadenas de texto',
        }),
      );
    }

    try {
      await this.supplierService.update({ id: req.params.id, ...req.body });
      return res
        .status(200)
        .json(
          toResponseDto(true, { message: 'Proveedor actualizado con exito' }),
        );
    } catch (error) {
      if (error instanceof SupplierTaxIdError) {
        return res
          .status(error.statusCode)
          .json(toResponseDto(false, { message: error.message }));
      }
      console.error('Error al actualizar proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al actualizar proveedor',
        }),
      );
    }
  };

  delete = async (req: Request<UpdateSupplierParams>, res: Response) => {
    try {
      await this.supplierService.delete(req.params.id);
      return res
        .status(200)
        .json(
          toResponseDto(true, { message: 'Proveedor eliminado con exito' }),
        );
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al eliminar proveedor',
        }),
      );
    }
  };
}
