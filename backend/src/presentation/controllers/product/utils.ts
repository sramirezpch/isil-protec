export type CreateProductBody = {
  name: string;
  sku?: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
};

export type UpdateProductParams = { id: string };

export type UpdateProductBody = Partial<{
  name: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
}>;

export type GenerateSkuQuery = {
  franchiseId: string;
  lineaId: string;
  name: string;
};

export type GenerateLabelQuery = {
  quantity?: string;
};
