export interface Product {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
