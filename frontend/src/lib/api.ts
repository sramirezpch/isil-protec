export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

type ApiResponse<T> = {
  success: boolean
  data: T
}

export type Formato = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export async function getFormatos(): Promise<Formato[]> {
  const res = await fetch(`${API_URL}/formato`)
  if (!res.ok) {
    throw new Error(`Error al obtener formatos (${res.status})`)
  }
  const body: ApiResponse<{ formatos: Formato[] }> = await res.json()
  return body.data.formatos
}

export type CatalogData = {
  name: string
  active: boolean
}

// Sends an optional JSON body and throws the backend's message on 4xx/5xx
async function sendJson(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data: unknown,
  fallbackError: string,
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    ...(data !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  })
  if (!res.ok) {
    const body: ApiResponse<{ message?: string }> | null = await res
      .json()
      .catch(() => null)
    throw new Error(body?.data.message ?? `${fallbackError} (${res.status})`)
  }
}

export function createFormato(formato: CatalogData): Promise<void> {
  return sendJson('POST', '/formato', formato, 'Error al registrar el formato')
}

export function updateFormato(
  id: string,
  changes: Partial<CatalogData>,
): Promise<void> {
  return sendJson(
    'PATCH',
    `/formato/${id}`,
    changes,
    'Error al actualizar el formato',
  )
}

// The backend soft-deletes: the formato stays listed as inactive
export function deleteFormato(id: string): Promise<void> {
  return sendJson(
    'DELETE',
    `/formato/${id}`,
    undefined,
    'Error al eliminar el formato',
  )
}

export type Brand = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export async function getBrands(): Promise<Brand[]> {
  const res = await fetch(`${API_URL}/brand`)
  if (!res.ok) {
    throw new Error(`Error al obtener marcas (${res.status})`)
  }
  const body: ApiResponse<{ brands: Brand[] }> = await res.json()
  return body.data.brands
}

export function createBrand(brand: CatalogData): Promise<void> {
  return sendJson('POST', '/brand', brand, 'Error al registrar la marca')
}

export function updateBrand(
  id: string,
  changes: Partial<CatalogData>,
): Promise<void> {
  return sendJson('PATCH', `/brand/${id}`, changes, 'Error al actualizar la marca')
}

// The backend soft-deletes: the brand stays listed as inactive
export function deleteBrand(id: string): Promise<void> {
  return sendJson('DELETE', `/brand/${id}`, undefined, 'Error al eliminar la marca')
}

// GET /franchise joins the formato and returns its name too
export type Franquicia = {
  id: string
  name: string
  active: boolean
  formatoId: string
  formatoName: string
}

export type FranquiciaData = {
  name: string
  active: boolean
  formatoId: string
}

export async function getFranquicias(): Promise<Franquicia[]> {
  const res = await fetch(`${API_URL}/franchise`)
  if (!res.ok) {
    throw new Error(`Error al obtener franquicias (${res.status})`)
  }
  const body: ApiResponse<{ franchises: Franquicia[] }> = await res.json()
  return body.data.franchises
}

export function createFranquicia(franquicia: FranquiciaData): Promise<void> {
  return sendJson(
    'POST',
    '/franchise',
    franquicia,
    'Error al registrar la franquicia',
  )
}

export function updateFranquicia(
  id: string,
  changes: Partial<FranquiciaData>,
): Promise<void> {
  return sendJson(
    'PATCH',
    `/franchise/${id}`,
    changes,
    'Error al actualizar la franquicia',
  )
}

// The backend soft-deletes: the franquicia stays listed as inactive
export function deleteFranquicia(id: string): Promise<void> {
  return sendJson(
    'DELETE',
    `/franchise/${id}`,
    undefined,
    'Error al eliminar la franquicia',
  )
}

// GET /linea joins the brand and returns its name, not its id
export type Linea = {
  id: string
  name: string
  brandName: string
  active: boolean
}

export type LineaData = {
  name: string
  brandId: string
  active: boolean
}

export async function getLineas(): Promise<Linea[]> {
  const res = await fetch(`${API_URL}/linea`)
  if (!res.ok) {
    throw new Error(`Error al obtener líneas (${res.status})`)
  }
  const body: ApiResponse<{ lineas: Linea[] }> = await res.json()
  return body.data.lineas
}

export function createLinea(linea: LineaData): Promise<void> {
  return sendJson('POST', '/linea', linea, 'Error al registrar la línea')
}

export function updateLinea(
  id: string,
  changes: Partial<LineaData>,
): Promise<void> {
  return sendJson(
    'PATCH',
    `/linea/${id}`,
    changes,
    'Error al actualizar la línea',
  )
}

// The backend soft-deletes: the linea stays listed as inactive
export function deleteLinea(id: string): Promise<void> {
  return sendJson(
    'DELETE',
    `/linea/${id}`,
    undefined,
    'Error al eliminar la línea',
  )
}
