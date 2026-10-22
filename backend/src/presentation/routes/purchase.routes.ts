import { Router } from 'express';
import type { PurchaseController } from '../controllers/purchase/purchase.controller';

export class PurchaseRouter {
  public router: Router;

  constructor(private readonly purchaseController: PurchaseController) {
    this.router = Router();

    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.purchaseController.findAll);
    this.router.get('/:id', this.purchaseController.findById);
    this.router.post('/', this.purchaseController.create);
    this.router.patch('/:id', this.purchaseController.update);
    this.router.post('/:id/cancel', this.purchaseController.cancel);
    this.router.post('/:id/receive', this.purchaseController.receive);
  }
}
