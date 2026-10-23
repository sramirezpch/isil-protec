import type {
  ITaxIdValidator,
  TaxIdValidationResult,
} from '../../application/port/tax-id-validator';

// Development only: accepts any Tax ID without calling LookupTax, so
// suppliers can be created without an API key or spending its quota
export class SkipTaxIdValidator implements ITaxIdValidator {
  async validate(): Promise<TaxIdValidationResult> {
    return {
      status: 'VALID',
      companyName: null,
      address: null,
      message: 'Validación de Tax ID omitida en development',
      retryable: false,
    };
  }
}
