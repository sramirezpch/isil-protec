import type {
  CreateSupplierInput,
  ISupplierRepository,
  UpdateSupplierInput,
} from '../port/supplier.repository';
import type {
  ITaxIdValidator,
  TaxIdValidationResult,
  ValidateTaxIdInput,
} from '../port/tax-id-validator';
import { TaxIdProviderError } from '../port/tax-id-validator';

export const SUPPORTED_TAX_ID_COUNTRIES = [
  'JP',
  'PE',
  'US',
  'GB',
  'CA',
] as const;

export class SupplierTaxIdError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'SupplierTaxIdError';
  }
}

export class SupplierService {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly taxIdValidator: ITaxIdValidator,
  ) {}

  async findAll(query?: string) {
    return await this.supplierRepository.findAll(query);
  }

  async validateTaxId(
    input: ValidateTaxIdInput,
  ): Promise<TaxIdValidationResult> {
    const country = input.country.trim().toUpperCase();
    const taxId = input.taxId.trim();

    if (!country || !taxId) {
      throw new SupplierTaxIdError('El país y el Tax ID son obligatorios', 400);
    }

    if (!this.isSupportedCountry(country)) {
      throw new SupplierTaxIdError(
        `La validación de Tax ID todavía no está habilitada para ${country}`,
        400,
      );
    }

    let result: TaxIdValidationResult;
    try {
      result = await this.taxIdValidator.validate({ country, taxId });
    } catch (error) {
      if (!(error instanceof TaxIdProviderError)) {
        throw error;
      }
      throw new SupplierTaxIdError(
        error.retryable
          ? 'El servicio de validación de Tax ID no está disponible; inténtalo nuevamente'
          : 'No se pudo completar la validación de Tax ID con el servicio externo',
        error.retryable ? 503 : 502,
      );
    }

    if (result.status === 'INVALID') {
      throw new SupplierTaxIdError('El Tax ID no es válido', 422);
    }
    if (result.status === 'UNSUPPORTED') {
      throw new SupplierTaxIdError(
        'LookupTax no admite la validación de este país o tipo de Tax ID',
        422,
      );
    }
    if (result.status === 'UNVERIFIED') {
      throw new SupplierTaxIdError(
        'El Tax ID pasó la validación de formato, pero no pudo confirmarse en un registro oficial',
        422,
      );
    }
    if (result.status === 'INDETERMINATE') {
      throw new SupplierTaxIdError(
        'No se pudo confirmar el Tax ID en este momento; inténtalo nuevamente',
        503,
      );
    }

    return result;
  }

  async create(input: CreateSupplierInput) {
    const country = input.country.trim().toUpperCase();
    const taxId = input.taxId.trim();
    await this.validateTaxId({ country, taxId });
    return await this.supplierRepository.create({ ...input, country, taxId });
  }

  async update(input: UpdateSupplierInput) {
    const existing = await this.supplierRepository.findById(input.id);
    if (!existing) {
      throw new SupplierTaxIdError('No se encontró el proveedor', 404);
    }

    const nextCountry =
      input.country?.trim().toUpperCase() ??
      existing.country.trim().toUpperCase();
    const nextTaxId = input.taxId?.trim() ?? existing.taxId.trim();
    const sameCountry = nextCountry === existing.country.trim().toUpperCase();
    const sameTaxId =
      nextTaxId.toUpperCase() === existing.taxId.trim().toUpperCase();

    if (!sameCountry || !sameTaxId) {
      await this.validateTaxId({ country: nextCountry, taxId: nextTaxId });
    }

    return await this.supplierRepository.update({
      ...input,
      ...(input.country !== undefined && { country: nextCountry }),
      ...(input.taxId !== undefined && { taxId: nextTaxId }),
    });
  }

  async delete(id: string) {
    return await this.supplierRepository.delete(id);
  }

  private isSupportedCountry(
    country: string,
  ): country is (typeof SUPPORTED_TAX_ID_COUNTRIES)[number] {
    return SUPPORTED_TAX_ID_COUNTRIES.some(
      (supportedCountry) => supportedCountry === country,
    );
  }
}
