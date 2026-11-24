import { Router } from 'express';
import type { ArticleTypeController } from '../controllers/articleType/articleType.controller';

export class ArticleTypeRouter {
  public router: Router;

  constructor(private readonly articleTypeController: ArticleTypeController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.articleTypeController.findAll);
    this.router.post('/', this.articleTypeController.create);
    this.router.patch('/:id', this.articleTypeController.update);
    this.router.delete('/:id', this.articleTypeController.delete);
  }
}