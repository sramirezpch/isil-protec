export type CreateLineaBody = {
  name: string;
  brandId: string;
  active: boolean;
};

export type UpdateLineaBody = Partial<{
  name: string;
  brandId: string;
  active: boolean;
}>;

export type UpdateLineaParams = {
  id: string;
};
