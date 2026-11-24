export type CreateArticleTypeBody = {
  name: string;
  active: boolean;
};

export type UpdateArticleTypeBody = Partial<{
  name: string;
  active: boolean;
}>;

export type UpdateArticleTypeParams = {
  id: string;
};