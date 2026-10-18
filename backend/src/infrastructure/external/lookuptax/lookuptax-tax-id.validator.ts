import {
  TaxIdProviderError,
  type ITaxIdValidator,
  type TaxIdValidationResult,
  type TaxIdValidationStatus,
  type ValidateTaxIdInput,
} from '../../../application/port/tax-id-validator';

interface LookupTaxResponse {
  result?: {
    status?: unknown;
    message?: unknown;
    retryable?: unknown;
  };
  entity?: {
    name?: unknown;
    address?: unknown;
  };
}

const validationStatuses: readonly TaxIdValidationStatus[] = [
  'VALID',
  'INVALID',
  'UNVERIFIED',
  'INDETERMINATE',
  'UNSUPPORTED',
];

export class LookupTaxTaxIdValidator implements ITaxIdValidator {
  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
  ) {}

  async validate(input: ValidateTaxIdInput): Promise<TaxIdValidationResult> {
    if (!this.apiKey || !this.apiUrl) {
      throw new TaxIdProviderError(
        'TAXID_PRO_API_KEY y TAXID_PRO_API_URL deben estar configurados',
        false,
      );
    }

    let endpoint: URL;
    try {
      endpoint = new URL(this.apiUrl);
    } catch {
      throw new TaxIdProviderError(
        'TAXID_PRO_API_URL debe ser una URL absoluta válida',
        false,
      );
    }

    if (endpoint.protocol !== 'https:') {
      throw new TaxIdProviderError('TAXID_PRO_API_URL debe usar HTTPS', false);
    }

    if (!endpoint.pathname.replace(/\/+$/, '').endsWith('/validate')) {
      endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, '')}/validate`;
    }
    endpoint.searchParams.set('country_iso', input.country);
    endpoint.searchParams.set('tin', input.taxId);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new TaxIdProviderError(
        'La solicitud al servicio LookupTax falló',
        true,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TaxIdProviderError(
        'LookupTax devolvió una respuesta JSON no válida',
        response.status === 429 || response.status >= 500,
      );
    }

    if (!this.isLookupTaxResponse(payload)) {
      throw new TaxIdProviderError(
        'LookupTax devolvió una respuesta incompleta',
        response.status === 429 || response.status >= 500,
      );
    }

    const status = payload.result?.status;
    const validationStatus =
      typeof status === 'string'
        ? validationStatuses.find((candidate) => candidate === status)
        : undefined;
    if (!validationStatus) {
      throw new TaxIdProviderError(
        'LookupTax devolvió un estado de validación desconocido',
        response.status === 429 || response.status >= 500,
      );
    }

    if (!response.ok && validationStatus !== 'UNSUPPORTED') {
      throw new TaxIdProviderError(
        response.status === 429 || response.status >= 500
          ? 'LookupTax no está disponible temporalmente'
          : 'LookupTax rechazó la solicitud',
        response.status === 429 || response.status >= 500,
      );
    }

    return {
      status: validationStatus,
      companyName:
        typeof payload.entity?.name === 'string' ? payload.entity.name : null,
      address:
        typeof payload.entity?.address === 'string'
          ? payload.entity.address
          : null,
      message:
        typeof payload.result?.message === 'string'
          ? payload.result.message
          : '',
      retryable: payload.result?.retryable === true,
    };
  }

  private isLookupTaxResponse(value: unknown): value is LookupTaxResponse {
    return typeof value === 'object' && value !== null && 'result' in value;
  }
}
