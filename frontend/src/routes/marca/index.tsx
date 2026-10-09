import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogFormModal from '../../components/CatalogFormModal'
import CatalogTable from '../../components/CatalogTable'
import {
  type Brand,
  type CatalogData,
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from '../../lib/api'

export const Route = createFileRoute('/marca/')({
  loader: () => getBrands(),
  component: RouteComponent,
  pendingComponent: () => (
    <main className="px-8 py-8 text-slate-500">Cargando marcas...</main>
  ),
  errorComponent: ({ error }) => (
    <main className="px-8 py-8">
      <p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener marcas'}
      </p>
    </main>
  ),
})

function RouteComponent() {
  const brands = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Mutations don't return the brand, so reload the list after each one
  const crearMarca = async (brand: CatalogData) => {
    await createBrand(brand)
    await router.invalidate()
    setCreating(false)
  }

  const editarMarca = async (brand: CatalogData) => {
    if (!editing) return
    // PATCH only the fields that actually changed
    const changes: Partial<CatalogData> = {}
    if (brand.name !== editing.name) changes.name = brand.name
    if (brand.active !== editing.active) changes.active = brand.active

    if (Object.keys(changes).length > 0) {
      await updateBrand(editing.id, changes)
      await router.invalidate()
    }
    setEditing(null)
  }

  const eliminarMarca = async (brand: Brand) => {
    if (!window.confirm(`¿Eliminar la marca "${brand.name}"?`)) return
    setDeleteError(null)
    try {
      await deleteBrand(brand.id)
      await router.invalidate()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Error al eliminar la marca',
      )
    }
  }

  const term = query.trim().toLowerCase()
  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(term) || b.id.toLowerCase().includes(term),
  )

  return (
    <main className="px-8 py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h1 className="m-0 text-3xl font-bold text-slate-900">
          Listado de Marcas
        </h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
        >
          + Nueva Marca
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar marca..."
        className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      {deleteError && (
        <p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      <CatalogTable
        items={filtered}
        emptyMessage="No se encontraron marcas."
        onEdit={setEditing}
        onDelete={eliminarMarca}
      />

      {creating && (
        <CatalogFormModal
          title="Registrar Nueva Marca"
          entityLabel="Marca"
          submitLabel="Confirmar Registro"
          onClose={() => setCreating(false)}
          onConfirm={crearMarca}
        />
      )}

      {editing && (
        <CatalogFormModal
          key={editing.id}
          title="Editar Marca"
          entityLabel="Marca"
          submitLabel="Guardar Cambios"
          initial={{ name: editing.name, active: editing.active }}
          onClose={() => setEditing(null)}
          onConfirm={editarMarca}
        />
      )}
    </main>
  )
}
