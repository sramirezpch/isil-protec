import { Router } from "express";
import type { FormatoController } from "../controllers/formatoController";

export class FormatoRouter {
  public router: Router;

  constructor(private readonly formatoController: FormatoController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.formatoController.getAllFormatos);
  }
}
