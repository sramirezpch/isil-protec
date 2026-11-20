import { Router } from 'express';
import type { ReservationController } from '../controllers/reservation/reservation.controller';

export class ReservationRouter {
  public router: Router;

  constructor(private readonly reservationController: ReservationController) {
    this.router = Router();
    this.router.get('/', this.reservationController.findAll);
    this.router.post('/', this.reservationController.create);
  }
}
