import { Router } from 'express';
import { BrandController } from '../controllers/BrandController';

export class BrandRouter {
    public readonly router: Router = new Router();

    constructor(private readonly brandController: BrandController) {
        this.initRoutes();
    }

    private initRoutes(): void {
        this.router.get('/brand/', this.brandController.getAll);
        this.router.post('/brand/', this.brandController.create);
        this.router.patch('/brand/:id', this.brandController.update);
        this.router.delete('/brand/:id', this.brandController.delete);
    }
}