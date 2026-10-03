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

export async function createBrand(name: string): Promise<void> {
  const res = await fetch(`${API_URL}/brand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    throw new Error(`Error al registrar la marca (${res.status})`)
  }
}
