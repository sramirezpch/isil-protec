import { Request, Response } from 'express';
import { SupplierService } from '../../../application/services/supplier.service';
import { DtoResponse, toResponseDto } from '../../../utils';
import {
  CreateSupplierBody,
  UpdateSupplierBody,
  UpdateSupplierParams,
} from './utils';

export class SupplierController {
  constructor(private readonly supplierService: SupplierService) { }

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query : undefined;
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
  }

  create = async (
    req: Request<null, DtoResponse, CreateSupplierBody>,
    res: Response,
  ) => {
    try {
      await this.supplierService.create(req.body);
      return res
        .status(201)
        .json(toResponseDto(true, { message: 'Proveedor creado con exito' }));
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al crear proveedor',
        }),
      );
    }
  }

  update = async (
    req: Request<UpdateSupplierParams, DtoResponse, UpdateSupplierBody>,
    res: Response,
  ) => {
    try {
      await this.supplierService.update({ id: req.params.id, ...req.body });
      return res.status(200).json(toResponseDto(true, { message: 'Proveedor actualizado con exito' }));
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al actualizar proveedor',
        }),
      );
    }
  }

  delete = async (req: Request<UpdateSupplierParams>, res: Response) => {
    try {
      await this.supplierService.delete(req.params.id);
      return res.status(200).json(toResponseDto(true, { message: 'Proveedor eliminado con exito' }));
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrio un error al eliminar proveedor',
        }),
      );
    }
  }
}