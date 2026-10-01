export type UpdateBrandParams = {
  id: string;
};

export type UpdateBrandBody = Partial<{
  name: string;
  active: boolean;
}>;
