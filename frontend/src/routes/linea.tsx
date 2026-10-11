import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogTable from '../components/CatalogTable'
import RelatedCatalogFormModal, {
  type RelatedCatalogData,
} from '../components/RelatedCatalogFormModal'
import {
  createLinea,
  deleteLinea,
  getBrands,
  getLineas,
  type Linea,
  type LineaData,
  updateLinea,
} from '../lib/api'

export const Route = createFileRoute('/linea')({
  // Brands fill the "Marca" select in the form
  loader: async () => {
    const [lineas, brands] = await Promise.all([getLineas(), getBrands()])
    return { lineas, brands }
  },
  component: RouteComponent,
  pendingComponent: () => (
    <main className="px-8 py-8 text-slate-500">Cargando líneas...</main>
  ),
  errorComponent: ({ error }) => (
    <main className="px-8 py-8">
      <p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener líneas'}
      </p>
    </main>
  ),
})

function RouteComponent() {
  const { lineas, brands } = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Linea | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // GET /linea only returns the brand's name, so find its id by name
  const editingBrandId = editing
    ? (brands.find((b) => b.name === editing.brandName)?.id ?? '')
    : ''

  // Only active brands can be picked, but keep the current one selectable
  const brandOptions = (currentId?: string) =>
    brands.filter((b) => b.active || b.id === currentId)

  const toLineaData = (data: RelatedCatalogData): LineaData => ({
    name: data.name,
    brandId: data.relatedId,
    active: data.active,
  })

  // Mutations don't return the linea, so reload the list after each one
  const crearLinea = async (data: RelatedCatalogData) => {
    await createLinea(toLineaData(data))
    await router.invalidate()
    setCreating(false)
  }

  const editarLinea = async (data: RelatedCatalogData) => {
    if (!editing) return
    // PATCH only the fields that actually changed
    const next = toLineaData(data)
    const changes: Partial<LineaData> = {}
    if (next.name !== editing.name) changes.name = next.name
    if (next.active !== editing.active) changes.active = next.active
    if (next.brandId !== editingBrandId) changes.brandId = next.brandId

    if (Object.keys(changes).length > 0) {
      await updateLinea(editing.id, changes)
      await router.invalidate()
    }
    setEditing(null)
  }

  const eliminarLinea = async (linea: Linea) => {
    if (!window.confirm(`¿Eliminar la línea "${linea.name}"?`)) return
    setDeleteError(null)
    try {
      await deleteLinea(linea.id)
      await router.invalidate()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Error al eliminar la línea',
      )
    }
  }

  const term = query.trim().toLowerCase()
  const filtered = lineas.filter(
    (l) =>
      l.name.toLowerCase().includes(term) ||
      l.id.toLowerCase().includes(term) ||
      l.brandName.toLowerCase().includes(term),
  )

  return (
    <main className="px-8 py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h1 className="m-0 text-3xl font-bold text-slate-900">
          Listado de Líneas
        </h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
        >
          + Nueva Línea
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar línea..."
        className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      {deleteError && (
        <p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      <CatalogTable
        items={filtered}
        emptyMessage="No se encontraron líneas."
        extraColumns={[{ header: 'Marca', render: (l) => l.brandName }]}
        onEdit={setEditing}
        onDelete={eliminarLinea}
      />

      {creating && (
        <RelatedCatalogFormModal
          title="Nueva Línea"
          submitLabel="Confirmar Registro"
          entityLabel="Línea"
          relatedLabel="Marca"
          relatedPlaceholder="Seleccione una marca..."
          options={brandOptions()}
          onClose={() => setCreating(false)}
          onConfirm={crearLinea}
        />
      )}

      {editing && (
        <RelatedCatalogFormModal
          key={editing.id}
          title="Editar Línea"
          submitLabel="Guardar Cambios"
          entityLabel="Línea"
          relatedLabel="Marca"
          relatedPlaceholder="Seleccione una marca..."
          options={brandOptions(editingBrandId)}
          initial={{
            name: editing.name,
            relatedId: editingBrandId,
            active: editing.active,
          }}
          onClose={() => setEditing(null)}
          onConfirm={editarLinea}
        />
      )}
    </main>
  )
}
