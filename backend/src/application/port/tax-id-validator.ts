export interface ValidateTaxIdInput {
  country: string;
  taxId: string;
}

export type TaxIdValidationStatus =
  | 'VALID'
  | 'INVALID'
  | 'UNVERIFIED'
  | 'INDETERMINATE'
  | 'UNSUPPORTED';

export interface TaxIdValidationResult {
  status: TaxIdValidationStatus;
  companyName: string | null;
  address: string | null;
  message: string;
  retryable: boolean;
}

export interface ITaxIdValidator {
  validate(input: ValidateTaxIdInput): Promise<TaxIdValidationResult>;
}

export class TaxIdProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'TaxIdProviderError';
  }
}
