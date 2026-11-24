import type { Request, Response } from 'express';
import type { ArticleTypeService } from '../../../application/services/articleType.service';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type {
  CreateArticleTypeBody,
  UpdateArticleTypeBody,
  UpdateArticleTypeParams,
} from './utils';
import { ArticleTypeAlreadyExists, ArticleTypeNotFound } from '../../../domain/errors/articleType.errors';

export class ArticleTypeController {
  constructor(private readonly articleTypeService: ArticleTypeService) {}

  findAll = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const articleTypes = await this.articleTypeService.findAll();
      return res.status(200).json(toResponseDto(true, { articleTypes }));
    } catch (error) {
      console.error('Error al obtener tipos de artículo:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al obtener tipos de artículo',
        }),
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateArticleTypeBody>,
    res: Response,
  ) => {
    try {
      const { name, active } = req.body;
      await this.articleTypeService.create({ name, active });
      return res
        .status(201)
        .json(toResponseDto(true, { message: 'Tipo de artículo creado exitosamente' }));
    } catch (error: any) {
      console.error('Error al crear tipo de artículo:', error);
      
      if (error instanceof ArticleTypeAlreadyExists) {
        return res.status(409).json(
          toResponseDto(false, { message: error.message }),
        );
      }

      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrió un error al crear el tipo de artículo' }),
      );
    }
  };

  update = async (
    req: Request<UpdateArticleTypeParams, DtoResponse, UpdateArticleTypeBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      const { name, active } = req.body;
      await this.articleTypeService.update({ id, name, active });
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Tipo de artículo actualizado con éxito' }));
    } catch (error: any) {
      console.error('Error al actualizar tipo de artículo:', error);
      
      if (error instanceof ArticleTypeNotFound) {
        return res.status(404).json(
          toResponseDto(false, { message: error.message }),
        );
      }

      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrió un error al actualizar el tipo de artículo' }),
      );
    }
  };

  delete = async (
    req: Request<UpdateArticleTypeParams, DtoResponse, null>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      await this.articleTypeService.delete(id);
      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Tipo de artículo eliminado exitosamente' }));
    } catch (error: any) {
      console.error('Error al eliminar tipo de artículo:', error);
      
      if (error instanceof ArticleTypeNotFound) {
        return res.status(404).json(
          toResponseDto(false, { message: error.message }),
        );
      }

      return res.status(500).json(
        toResponseDto(false, { message: 'Ocurrió un error al eliminar el tipo de artículo' }),
      );
    }
  };
}