import { Router } from 'express';
import type { FormatoController } from '../controllers/formato/formato.controller';

export class FormatoRouter {
  public router: Router;

  constructor(private readonly formatoController: FormatoController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.formatoController.findAll);
    this.router.post('/', this.formatoController.create);
    this.router.patch('/:id', this.formatoController.update);
    this.router.delete('/:id', this.formatoController.delete);
  }
}
