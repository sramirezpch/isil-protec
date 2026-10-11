export type CreateProductBody = {
  name: string;
  sku: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
};

export type UpdateProductParams = { id: string };
export type UpdateProductBody = Partial<{
  name: string;
  sku: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
}>;
