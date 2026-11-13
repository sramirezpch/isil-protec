import { Router } from 'express';
import type { ProductController } from '../controllers/product/product.controller';

export class ProductRouter {
  public router: Router;

  constructor(private readonly productController: ProductController) {
    this.router = Router();

    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/generate-sku', this.productController.generateSku);
    this.router.get('/', this.productController.findAll);
    this.router.post('/', this.productController.create);
    this.router.get('/:id/label', this.productController.generateLabel);
    this.router.get('/:id', this.productController.findById);
    this.router.patch('/:id', this.productController.update);
    this.router.delete('/:id', this.productController.delete);
  }
}
