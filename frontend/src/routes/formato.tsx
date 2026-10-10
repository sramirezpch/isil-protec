import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogFormModal from '../components/CatalogFormModal'
import CatalogTable from '../components/CatalogTable'
import {
  type CatalogData,
  createFormato,
  deleteFormato,
  type Formato,
  getFormatos,
  updateFormato,
} from '../lib/api'

export const Route = createFileRoute('/formato')({
  loader: () => getFormatos(),
  component: RouteComponent,
  pendingComponent: () => (
    <main className="px-8 py-8 text-slate-500">Cargando formatos...</main>
  ),
  errorComponent: ({ error }) => (
    <main className="px-8 py-8">
      <p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error
          ? error.message
          : 'Ocurrió un error al obtener formatos'}
      </p>
    </main>
  ),
})

function RouteComponent() {
  const formatos = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Formato | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // The POST response doesn't include the new formato, so reload the list
  const crearFormato = async (formato: CatalogData) => {
    await createFormato(formato)
    await router.invalidate()
    setCreating(false)
  }

  const editarFormato = async (formato: CatalogData) => {
    if (!editing) return
    // PATCH only the fields that actually changed
    const changes: Partial<CatalogData> = {}
    if (formato.name !== editing.name) changes.name = formato.name
    if (formato.active !== editing.active) changes.active = formato.active

    if (Object.keys(changes).length > 0) {
      await updateFormato(editing.id, changes)
      await router.invalidate()
    }
    setEditing(null)
  }

  const eliminarFormato = async (formato: Formato) => {
    if (!window.confirm(`¿Eliminar el formato "${formato.name}"?`)) return
    setDeleteError(null)
    try {
      await deleteFormato(formato.id)
      await router.invalidate()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Error al eliminar el formato',
      )
    }
  }

  const term = query.trim().toLowerCase()
  const filtered = formatos.filter(
    (f) =>
      f.name.toLowerCase().includes(term) || f.id.toLowerCase().includes(term),
  )

  return (
    <main className="px-8 py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h1 className="m-0 text-3xl font-bold text-slate-900">
          Listado de Formatos
        </h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
        >
          + Nuevo Formato
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar formato..."
        className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      {deleteError && (
        <p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      <CatalogTable
        items={filtered}
        emptyMessage="No se encontraron formatos."
        onEdit={setEditing}
        onDelete={eliminarFormato}
      />

      {creating && (
        <CatalogFormModal
          title="Nuevo Formato"
          entityLabel="Formato"
          submitLabel="Confirmar Registro"
          onClose={() => setCreating(false)}
          onConfirm={crearFormato}
        />
      )}

      {editing && (
        <CatalogFormModal
          key={editing.id}
          title="Editar Formato"
          entityLabel="Formato"
          submitLabel="Guardar Cambios"
          initial={{ name: editing.name, active: editing.active }}
          onClose={() => setEditing(null)}
          onConfirm={editarFormato}
        />
      )}
    </main>
  )
}
