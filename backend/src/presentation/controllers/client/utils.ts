export type UpdateClientParams = {
  id: string;
};

export type DeleteClientParams = {
  id: string;
};

export type UpdateClientBody = Partial<{
  phone: string;
  name: string;
  lastName: string;
  aliasTiktok: string;
  active: boolean;
}>;

export type CreateClientBody = {
  phone: string; 
  name?: string;
  lastName?: string;
  aliasTiktok?: string;
  active?: boolean;
};