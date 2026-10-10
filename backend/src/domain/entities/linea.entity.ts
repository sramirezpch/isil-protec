export interface Linea {
  id: string;
  name: string;
  brandId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
