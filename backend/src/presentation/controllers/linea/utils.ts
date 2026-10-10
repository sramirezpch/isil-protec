export type AddLineaBody = {
  name: string;
  idmarca: string;
  active: boolean;
}

export type UpdateLineaBody = Partial<{
  name: string;
  idmarca: string;
  active: boolean;
}>;

export type UpdateLineaParams = {
  id: string;
};