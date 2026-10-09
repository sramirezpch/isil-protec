export type DtoResponse = {
  success: boolean;
  data: Record<string, unknown>;
};

export const toResponseDto = (
  success: boolean,
  data: Record<string, unknown>,
): DtoResponse => {
  return {
    success,
    data,
  };
};
