export type UpdateBrandParams = {
  id: string;
};

export type DeleteBrandParams = {
  id: string;
}

export type UpdateBrandBody = Partial<{
  name: string;
  active: boolean;
}>;

export type CreateBrandBody = {
  name: string;
  active: boolean;
}