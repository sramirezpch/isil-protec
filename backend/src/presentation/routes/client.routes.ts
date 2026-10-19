import { Router } from 'express';
import type { ClientController } from '../controllers/client/client.controller';

export class ClientRouter {
  public router: Router;

  constructor(private readonly clientController: ClientController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.clientController.getAll);
    this.router.post('/', this.clientController.create);
    this.router.patch('/:id', this.clientController.updateById);
    this.router.delete('/:id', this.clientController.delete);
  }
}