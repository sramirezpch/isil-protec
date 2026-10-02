import { Router } from 'express';
import type { FormatoController } from '../controllers/formato/formato.controller';

export class FormatoRouter {
  public router: Router;

  constructor(private readonly formatoController: FormatoController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.formatoController.getAllFormatos);
    this.router.post('/', this.formatoController.addFormato);
  }
}
