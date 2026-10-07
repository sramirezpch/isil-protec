export type AddFormatoBody = {
  name: string;
  active: boolean;
}

export type UpdateFormatoBody = Partial<{
  name: string;
  active: boolean;
}>;

export type UpdateFormatoParams = {
  id: string;
};