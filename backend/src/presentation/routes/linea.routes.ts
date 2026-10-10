import { Router } from 'express';
import type { LineaController } from '../controllers/linea/linea.controller';

export class LineaRouter {
  public router: Router;

  constructor(private readonly lineaController: LineaController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.lineaController.findAll);
  }
}