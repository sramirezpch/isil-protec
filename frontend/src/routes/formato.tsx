import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogFormModal from '../components/CatalogFormModal'
import CatalogTable from '../components/CatalogTable'
import {
  type CatalogData,
  createFormato,
  type Formato,
  getFormatos,
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

  // The POST response doesn't include the new formato, so reload the list
  const crearFormato = async (formato: CatalogData) => {
    await createFormato(formato)
    await router.invalidate()
    setCreating(false)
  }

  // TODO: call PATCH /formato/:id once the update endpoint is merged
  const editarFormato = async (_formato: CatalogData) => {
    setEditing(null)
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

      <CatalogTable
        items={filtered}
        emptyMessage="No se encontraron formatos."
        onEdit={setEditing}
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
