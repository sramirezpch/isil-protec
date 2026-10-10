import { Router } from 'express';
import type { FranchiseController } from '../controllers/franchise/franchise.controller';

export class FranchiseRouter {
  public router: Router;

  constructor(private readonly franchiseController: FranchiseController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.franchiseController.getAll);
    this.router.post('/', this.franchiseController.create);
    this.router.patch('/:id', this.franchiseController.updateById);
    this.router.delete("/:id", this.franchiseController.delete)
  }
}