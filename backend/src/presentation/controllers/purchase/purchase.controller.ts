import type { Request, Response } from 'express';
import type { PurchaseService } from '../../../application/services/purchase.service';
import {
  DuplicatePurchaseItemError,
  EmptyPurchaseItemsError,
  InvalidNumericValueError,
  ProductNotFoundError,
  PurchaseAlreadyCancelledError,
  PurchaseAlreadyReceivedError,
  PurchaseNotFoundError,
  PurchaseStateConflictError,
  SupplierNotFoundError,
} from '../../../domain/errors/purchase.errors';
import { type DtoResponse, toResponseDto } from '../../../utils';
import {
  type CreatePurchaseBody,
  type PurchaseIdParams,
  type ReceivePurchaseBody,
  type UpdatePurchaseBody,
  type UpdatePurchaseStatusBody,
  sanitizeString,
  validateUuid,
} from './utils';

const VALID_STATUSES = new Set(['PENDING', 'RECEIVED', 'CANCELLED']);

export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = sanitizeString(req.query.query);
      let status: string | undefined;

      if (typeof req.query.status === 'string') {
        const uppercaseStatus = req.query.status.trim().toUpperCase();
        if (!VALID_STATUSES.has(uppercaseStatus)) {
          throw new InvalidNumericValueError(
            'status (debe ser PENDING, RECEIVED o CANCELLED)',
          );
        }
        status = uppercaseStatus;
      }

      const limit = req.query.limit
        ? Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
        : 20;
      const page = req.query.page
        ? Math.max(Number(req.query.page) || 1, 1)
        : 1;
      const offset = (page - 1) * limit;

      const purchases = await this.purchaseService.findAll(
        query,
        status,
        limit,
        offset,
      );
      return res
        .status(200)
        .json(toResponseDto(true, { purchases, page, limit }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al obtener las compras',
        res,
      );
    }
  };

  findById = async (
    req: Request<PurchaseIdParams>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      const purchase = await this.purchaseService.findById(id);
      return res.status(200).json(toResponseDto(true, { purchase }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al obtener la compra',
        res,
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreatePurchaseBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        throw new InvalidNumericValueError('body');
      }
      validateUuid(req.body.supplierId, 'supplierId');
      if (Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          validateUuid(item.productId, 'productId');
        }
      }

      const id = await this.purchaseService.create(req.body);
      return res
        .status(201)
        .json(
          toResponseDto(true, { message: 'Compra registrada con éxito', id }),
        );
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al registrar la compra',
        res,
      );
    }
  };

  update = async (
    req: Request<PurchaseIdParams, DtoResponse, UpdatePurchaseBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const validId = validateUuid(req.params.id, 'id');
      if (req.body?.supplierId) {
        validateUuid(req.body.supplierId, 'supplierId');
      }
      if (Array.isArray(req.body?.items)) {
        for (const item of req.body.items) {
          validateUuid(item.productId, 'productId');
        }
      }

      await this.purchaseService.update({ ...req.body, id: validId });
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Compra actualizada con éxito' }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al actualizar la compra',
        res,
      );
    }
  };

  updateStatus = async (
    req: Request<PurchaseIdParams, DtoResponse, UpdatePurchaseStatusBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = validateUuid(req.params.id, 'id');
      if (req.body?.status !== 'PENDING') {
        throw new InvalidNumericValueError('status (debe ser PENDING)');
      }

      await this.purchaseService.updateStatus(id, req.body.status);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Estado de compra actualizado con éxito' }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al actualizar el estado de la compra',
        res,
      );
    }
  };

  cancel = async (
    req: Request<PurchaseIdParams>,
    res: Response,
  ): Promise<Response> => {
    try {
      const validId = validateUuid(req.params.id, 'id');
      await this.purchaseService.cancel(validId);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Compra cancelada con éxito' }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al cancelar la compra',
        res,
      );
    }
  };

  receive = async (
    req: Request<PurchaseIdParams, DtoResponse, ReceivePurchaseBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const validId = validateUuid(req.params.id, 'id');
      if (Array.isArray(req.body?.items)) {
        for (const item of req.body.items) {
          validateUuid(item.productId, 'productId');
        }
      }

      await this.purchaseService.receive({ ...req.body, id: validId });
      return res.status(200).json(
        toResponseDto(true, {
          message:
            'Compra marcada como recibida y stock actualizado exitosamente',
        }),
      );
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al recibir la compra',
        res,
      );
    }
  };

  private handleError(
    error: unknown,
    defaultMessage: string,
    res: Response,
  ): Response {
    let status = 500;
    let message = defaultMessage;

    if (error instanceof PurchaseNotFoundError) {
      status = 404;
    } else if (
      error instanceof PurchaseAlreadyReceivedError ||
      error instanceof PurchaseAlreadyCancelledError ||
      error instanceof PurchaseStateConflictError
    ) {
      status = 409;
    } else if (
      error instanceof DuplicatePurchaseItemError ||
      error instanceof SupplierNotFoundError ||
      error instanceof ProductNotFoundError ||
      error instanceof EmptyPurchaseItemsError ||
      error instanceof InvalidNumericValueError
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
