import type { IProductRepository } from '../port/product.repository';

const MAX_GENERATE_ATTEMPTS = 3;

function normalizeSegment(text: string, length: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, length);
}

export function buildSkuPrefix(
  franchiseName: string,
  lineaName: string,
  productName: string,
): string {
  const fra = normalizeSegment(franchiseName, 3);
  const lin = normalizeSegment(lineaName, 3);
  const nom = normalizeSegment(productName, 3);
  return `${fra}-${lin}-${nom}`;
}

export function formatSkuCorrelative(
  prefix: string,
  correlative: number,
): string {
  return `${prefix}-${String(correlative).padStart(3, '0')}`;
}

export async function generateSku(
  productRepository: IProductRepository,
  franchiseName: string,
  lineaName: string,
  productName: string,
): Promise<string> {
  const prefix = buildSkuPrefix(franchiseName, lineaName, productName);
  const max = await productRepository.findMaxCorrelativeForPrefix(prefix);
  return formatSkuCorrelative(prefix, max + 1);
}

export async function generateSkuWithRetry(
  productRepository: IProductRepository,
  franchiseName: string,
  lineaName: string,
  productName: string,
  createFn: (sku: string) => Promise<void>,
): Promise<string> {
  const prefix = buildSkuPrefix(franchiseName, lineaName, productName);

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    const max = await productRepository.findMaxCorrelativeForPrefix(prefix);
    const sku = formatSkuCorrelative(prefix, max + 1);
    try {
      await createFn(sku);
      return sku;
    } catch (err) {
      if (attempt === MAX_GENERATE_ATTEMPTS) throw err;
      const isSkuConflict =
        err instanceof Error && err.name === 'ProductSkuAlreadyExistsError';
      if (!isSkuConflict) throw err;
    }
  }

  throw new Error('No se pudo generar un SKU único tras varios intentos');
}
