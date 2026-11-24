import type { ArticleType } from '../../domain/entities/articleType.entity';

export type UpdateArticleTypeData = Partial<
  Pick<ArticleType, 'name' | 'active'>
>;

export interface CreateArticleTypeInput {
  name: string;
  active: boolean;
}

export interface UpdateArticleTypeInput {
  id: string;
  name?: string;
  active?: boolean;
}

export interface IArticleTypeRepository {
  findAll(): Promise<ArticleType[]>;
  findById(id: string): Promise<ArticleType>;
  create(data: CreateArticleTypeInput): Promise<void>;
  update(id: string, data: UpdateArticleTypeData): Promise<void>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<ArticleType | null>;
}