import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogTable from '../components/CatalogTable'
import NuevoFormatoModal from '../components/NuevoFormatoModal'
import { type Formato, getFormatos } from '../lib/api'

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
  const loaded = Route.useLoaderData()
  const [formatos, setFormatos] = useState<Formato[]>(loaded)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // No POST endpoint yet: new formatos only live in local state
  const crearFormato = (name: string) => {
    const now = new Date().toISOString()
    setFormatos([
      ...formatos,
      {
        id: crypto.randomUUID(),
        name,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ])
    setModalOpen(false)
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
          onClick={() => setModalOpen(true)}
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
        idLabel="ID Formato"
        emptyMessage="No se encontraron formatos."
      />

      <NuevoFormatoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={crearFormato}
      />
    </main>
  )
}
