import { eq } from 'drizzle-orm';
import type {
  CreateArticleTypeInput,
  IArticleTypeRepository,
  UpdateArticleTypeData,
} from '../../../application/port/articleType.repository';
import type { ArticleType } from '../../../domain/entities/articleType.entity';
import { db } from '../db/connection';
import { articleTypeTable } from '../db/schema/articleType';
import { toDomain } from '../mappers/articleType.mapper';

export class ArticleTypeRepository implements IArticleTypeRepository {
  async findAll(): Promise<ArticleType[]> {
    const result = await db
      .select()
      .from(articleTypeTable)
      .where(eq(articleTypeTable.active, true));
    
    return result.map(toDomain);
  }

  async create(data: CreateArticleTypeInput): Promise<void> {
    await db.insert(articleTypeTable).values(data);
  }

  async update(id: string, data: UpdateArticleTypeData): Promise<void> {
    await db.update(articleTypeTable).set(data).where(eq(articleTypeTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db
      .update(articleTypeTable)
      .set({ active: false, deletedAt: new Date() })
      .where(eq(articleTypeTable.id, id));
  }

  async findById(id: string): Promise<ArticleType> {
    const [articleType] = await db
      .select()
      .from(articleTypeTable)
      .where(eq(articleTypeTable.id, id));

    return toDomain(articleType);
  }

  async findByName(name: string): Promise<ArticleType | null> {
    const [articleType] = await db
      .select()
      .from(articleTypeTable)
      .where(eq(articleTypeTable.name, name));

    return articleType ? toDomain(articleType) : null;
  }
}