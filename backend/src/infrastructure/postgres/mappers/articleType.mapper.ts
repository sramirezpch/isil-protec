import type { ArticleType } from '../../../domain/entities/articleType.entity';
import type { ArticleTypeModel } from '../db/schema/articleType';

export const toDomain = (row: ArticleTypeModel): ArticleType => ({
  id: row.id,
  name: row.name,
  active: row.active,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

export const toPersistence = (domain: ArticleType): ArticleTypeModel => ({
  id: domain.id,
  name: domain.name,
  active: domain.active,
  createdAt: domain.createdAt,
  updatedAt: domain.updatedAt,
  deletedAt: domain.deletedAt,
});