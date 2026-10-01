import { Router } from 'express';
import type { BrandController } from '../controllers/brand/brand.controller';

export class BrandRouter {
  public router: Router;

  constructor(private readonly brandController: BrandController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.brandController.getAll);
    this.router.patch('/:id', this.brandController.updateById);
  }
}
