import type { Request, Response } from 'express';
import type { SaleService } from '../../../application/services/sale.service';
import {
  ClientNotFoundError,
  DuplicateSaleItemError,
  EmptySaleItemsError,
  InsufficientStockError,
  SaleCannotBeCancelledError,
  SaleCannotBeEditedError,
  SaleInvalidFieldError,
  SaleNotFoundError,
  SaleProductNotFoundError,
  SaleStateConflictError,
} from '../../../domain/errors/sale.errors';
import { type DtoResponse, toResponseDto } from '../../../utils';
import {
  type CreateSaleBody,
  type SaleIdParams,
  type UpdateSaleStatusBody,
  sanitizeString,
  validateUuid,
} from './utils';

const VALID_STATUSES = new Set([
  'PENDING_PAYMENT',
  'PENDING_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

const VALID_UPDATE_STATUSES = new Set(['PENDING_DELIVERY', 'DELIVERED']);

export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  private validateSaleBody(body: CreateSaleBody): void {
    if (!body || typeof body !== 'object') {
      throw new SaleInvalidFieldError('body');
    }
    validateUuid(body.clientId, 'clientId');
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        validateUuid(item.productId, 'productId');
      }
    }
  }

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = sanitizeString(req.query.query);
      let status: string | undefined;

      if (typeof req.query.status === 'string') {
        const upperStatus = req.query.status.trim().toUpperCase();
        if (!VALID_STATUSES.has(upperStatus)) {
          throw new SaleInvalidFieldError(
            'status (debe ser PENDING_PAYMENT, PENDING_DELIVERY, DELIVERED o CANCELLED)',
          );
        }
        status = upperStatus;
      }

      const limit = req.query.limit
        ? Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
        : 20;
      const page = req.query.page
        ? Math.max(Number(req.query.page) || 1, 1)
        : 1;
      const offset = (page - 1) * limit;

      const sales = await this.saleService.findAll(query, status, limit, offset);
      return res.status(200).json(toResponseDto(true, { sales, page, limit }));
    } catch (error) {
      return this.handleError(error, 'Ocurrió un error al obtener las ventas', res);
    }
  };

  findById = async (
    req: Request<SaleIdParams>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      const sale = await this.saleService.findById(id);
      return res.status(200).json(toResponseDto(true, { sale }));
    } catch (error) {
      return this.handleError(error, 'Ocurrió un error al obtener la venta', res);
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateSaleBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      this.validateSaleBody(req.body);

      const id = await this.saleService.create(req.body);
      return res
        .status(201)
        .json(toResponseDto(true, { message: 'Venta registrada con éxito', id }));
    } catch (error) {
      return this.handleError(error, 'Ocurrió un error al registrar la venta', res);
    }
  };

  updateStatus = async (
    req: Request<SaleIdParams, DtoResponse, UpdateSaleStatusBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      const { status } = req.body ?? {};

      if (typeof status !== 'string' || !VALID_UPDATE_STATUSES.has(status)) {
        throw new SaleInvalidFieldError(
          'status (debe ser PENDING_DELIVERY o DELIVERED)',
        );
      }

      await this.saleService.updateStatus({
        id,
        status: status as 'PENDING_DELIVERY' | 'DELIVERED',
      });
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Estado de venta actualizado con éxito' }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al actualizar el estado de la venta',
        res,
      );
    }
  };

  update = async (
    req: Request<SaleIdParams, DtoResponse, CreateSaleBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      this.validateSaleBody(req.body);

      await this.saleService.update(id, req.body);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Venta actualizada con éxito' }));
    } catch (error) {
      return this.handleError(error, 'Ocurrió un error al actualizar la venta', res);
    }
  };

  cancel = async (
    req: Request<SaleIdParams>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      await this.saleService.cancel(id);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Venta cancelada con éxito' }));
    } catch (error) {
      return this.handleError(error, 'Ocurrió un error al cancelar la venta', res);
    }
  };

  private handleError(error: unknown, defaultMessage: string, res: Response): Response {
    let status = 500;
    let message = defaultMessage;

    if (error instanceof SaleNotFoundError) {
      status = 404;
    } else if (
      error instanceof SaleStateConflictError ||
      error instanceof SaleCannotBeEditedError ||
      error instanceof SaleCannotBeCancelledError
    ) {
      status = 409;
    } else if (
      error instanceof ClientNotFoundError ||
      error instanceof SaleProductNotFoundError ||
      error instanceof EmptySaleItemsError ||
      error instanceof DuplicateSaleItemError ||
      error instanceof InsufficientStockError ||
      error instanceof SaleInvalidFieldError
    ) {
      status = 400;
    }

    if (error instanceof Error && status !== 500) {
      message = error.message;
    } else if (status === 500) {
      console.error(defaultMessage, error);
    }

    return res.status(status).json(toResponseDto(false, { message }));
  }
}
