import { Router } from 'express';
import type { SaleController } from '../controllers/sale/sale.controller';

export class SaleRouter {
  public router: Router;

  constructor(private readonly saleController: SaleController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.saleController.findAll);
    this.router.get('/:id', this.saleController.findById);
    this.router.post('/', this.saleController.create);
    this.router.patch('/:id', this.saleController.update);
    this.router.patch('/:id/status', this.saleController.updateStatus);
    this.router.post('/:id/cancel', this.saleController.cancel);
  }
}
