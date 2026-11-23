import { Router } from 'express';
import type { ReservationController } from '../controllers/reservation/reservation.controller';

export class ReservationRouter {
  public router: Router;

  constructor(private readonly reservationController: ReservationController) {
    this.router = Router();
    this.router.get('/', this.reservationController.findAll);
    this.router.post('/', this.reservationController.create);
    this.router.get('/:id/payments', this.reservationController.findPayments);
    this.router.post('/:id/payments', this.reservationController.createPayment);
    this.router.post('/:id/cancel', this.reservationController.cancel);
  }
}
