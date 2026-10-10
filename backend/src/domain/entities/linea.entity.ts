export interface Linea {
  id: string;
  name: string;
  idmarca: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}