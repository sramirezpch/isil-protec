import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
              <th className="px-4 py-3.5 font-semibold">ID Formato</th>
              <th className="px-4 py-3.5 font-semibold">Nombre</th>
              <th className="px-4 py-3.5 font-semibold">Estado</th>
              <th className="w-48 px-4 py-3.5 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((formato) => (
              <tr
                key={formato.id}
                className="border-t border-slate-200 first:border-t-0"
              >
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900">
                  {formato.id}
                </td>
                <td className="px-4 py-3.5 text-slate-700">
                  {formato.name}
                </td>
                <td className="px-4 py-3.5">
                  {formato.active ? (
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 text-red-500 hover:text-red-700"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No se encontraron formatos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NuevoFormatoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={crearFormato}
      />
    </main>
  )
}
