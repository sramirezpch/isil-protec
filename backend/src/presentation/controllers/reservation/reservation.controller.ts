import type { Request, Response } from 'express';
import type { ReservationService } from '../../../application/services/reservation.service';
import {
  DuplicateReservationItemError,
  EmptyReservationItemsError,
  ReservationClientNotFoundError,
  ReservationDeadlineInvalidError,
  ReservationInvalidFieldError,
  ReservationPriceChangedError,
  ReservationProductNotFoundError,
} from '../../../domain/errors/reservation.errors';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type { CreateReservationBody } from './utils';
import { validateUuid } from './utils';

export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  findAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const reservations = await this.reservationService.findAll();
      return res.status(200).json(toResponseDto(true, { reservations }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al obtener las reservas',
        res,
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateReservationBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ReservationInvalidFieldError('body');
      }
      if (body.clientId !== undefined) {
        validateUuid(body.clientId, 'clientId');
      }
      if (body.items !== undefined && !Array.isArray(body.items)) {
        throw new ReservationInvalidFieldError('items');
      }
      for (const item of body.items ?? []) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new ReservationInvalidFieldError('item');
        }
        if (item.productId !== undefined) {
          validateUuid(item.productId, 'productId');
        }
      }

      const reservation = await this.reservationService.create(body);
      return res.status(201).json(toResponseDto(true, { reservation }));
    } catch (error) {
      return this.handleError(
        error,
        'Ocurrió un error al registrar la reserva',
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

    if (
      error instanceof ReservationClientNotFoundError ||
      error instanceof ReservationDeadlineInvalidError ||
      error instanceof ReservationInvalidFieldError ||
      error instanceof EmptyReservationItemsError ||
      error instanceof DuplicateReservationItemError ||
      error instanceof ReservationProductNotFoundError
    ) {
      status = 400;
      message = error.message;
    } else if (error instanceof ReservationPriceChangedError) {
      status = 409;
      message = error.message;
    } else {
      console.error(defaultMessage, error);
    }

    return res.status(status).json(toResponseDto(false, { message }));
  }
}
