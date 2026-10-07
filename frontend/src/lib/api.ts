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

// Sends a JSON body and throws the backend's message on 4xx/5xx
async function sendJson(
  method: 'POST',
  path: string,
  data: unknown,
  fallbackError: string,
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

export type Franquicia = {
  id: string
  name: string
  formato: string
  active: boolean
}

// No franquicia endpoint yet: test data until the backend exposes one
export const FRANQUICIAS_DE_PRUEBA: Franquicia[] = [
  { id: 'FRANQ-001', name: 'Dragon Ball GT', formato: 'Anime', active: true },
  { id: 'FRANQ-002', name: 'Marvel Legends', formato: 'Comic', active: true },
  { id: 'FRANQ-003', name: 'Neon Genesis', formato: 'Anime', active: true },
  { id: 'FRANQ-004', name: 'Stranger Things', formato: 'Serie', active: true },
  { id: 'FRANQ-005', name: 'Jujutsu Kaisen', formato: 'Anime', active: true },
  {
    id: 'FRANQ-006',
    name: 'Resident Evil',
    formato: 'Videojuego',
    active: false,
  },
]
