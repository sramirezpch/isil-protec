import type { 
  CreateArticleTypeInput, 
  IArticleTypeRepository, 
  UpdateArticleTypeInput 
} from '../port/articleType.repository';
import { ArticleTypeAlreadyExists, ArticleTypeNotFound } from '../../domain/errors/articleType.errors';

export class ArticleTypeService {
  constructor(private readonly articleTypeRepository: IArticleTypeRepository) {}

  async findAll() {
    return await this.articleTypeRepository.findAll();
  }

  async create(input: CreateArticleTypeInput) {
    const normalizedName = input.name.trim();
    
    if (!normalizedName || Array.from(normalizedName).length > 255) {
      throw new Error('El nombre del tipo de artículo debe tener entre 1 y 255 caracteres');
    }

    const existing = await this.articleTypeRepository.findByName(normalizedName);
    if (existing) {
      throw new ArticleTypeAlreadyExists();
    }

    return await this.articleTypeRepository.create({ 
      name: normalizedName, 
      active: input.active 
    });
  }

  async update(input: UpdateArticleTypeInput) {
    const { id, ...data } = input;
    
    const existing = await this.articleTypeRepository.findById(id);
    if (!existing) {
      throw new ArticleTypeNotFound();
    }

    return await this.articleTypeRepository.update(id, data);
  }

  async delete(id: string) {
    const existing = await this.articleTypeRepository.findById(id);
    if (!existing) {
      throw new ArticleTypeNotFound();
    }
    
    return await this.articleTypeRepository.delete(id);
  }
}