import { Router } from 'express';
import type { SupplierController } from '../controllers/supplier/supplier.controller';

export class SupplierRouter {
  public router: Router;

  constructor(private readonly supplierController: SupplierController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.supplierController.findAll);
    this.router.post('/validarTaxId', this.supplierController.validateTaxId);
    this.router.post('/', this.supplierController.create);
    this.router.patch('/:id', this.supplierController.update);
    this.router.delete('/:id', this.supplierController.delete);
  }
}
