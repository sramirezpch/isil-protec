export interface Franchise {
  id: string;
  name: string;
  active: boolean;
  formatoId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
