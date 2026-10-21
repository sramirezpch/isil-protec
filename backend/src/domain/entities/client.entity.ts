export interface Client {
  id: string;
  phone: string;
  name?: string | null;
  lastName?: string | null;
  aliasTiktok?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}