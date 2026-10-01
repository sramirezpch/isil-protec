import { Router } from 'express';
import { BrandController } from '../controllers/BrandController';

export class BrandRouter {
    public router: Router;

    constructor(private readonly brandController: BrandController) {
        this.router = new Router();
        this.initRoutes();
    }

    private initRoutes(): void {
        this.router.get('/brand/', this.brandController.getAll);
        this.router.patch('/brand/:id', this.brandController.update);
    }
}