import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import NuevaFranquiciaModal from '../components/NuevaFranquiciaModal'
import { FRANQUICIAS_DE_PRUEBA, type Franquicia, getFormatos } from '../lib/api'

export const Route = createFileRoute('/franquicia')({
  loader: () => getFormatos(),
  component: RouteComponent,
  pendingComponent: () => (
    <main className="px-8 py-8 text-slate-500">Cargando franquicias...</main>
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
  const [franquicias, setFranquicias] = useState<Franquicia[]>(
    FRANQUICIAS_DE_PRUEBA,
  )
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // No franquicia endpoint yet: new franquicias only live in local state
  const crearFranquicia = (name: string, formato: string) => {
    const next = franquicias.length + 1
    setFranquicias([
      ...franquicias,
      {
        id: `FRANQ-${String(next).padStart(3, '0')}`,
        name,
        formato,
        active: true,
      },
    ])
    setModalOpen(false)
  }

  const term = query.trim().toLowerCase()
  const filtered = franquicias.filter(
    (f) =>
      f.name.toLowerCase().includes(term) ||
      f.id.toLowerCase().includes(term) ||
      f.formato.toLowerCase().includes(term),
  )

  return (
    <main className="px-8 py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h1 className="m-0 text-3xl font-bold text-slate-900">
          Listado de Franquicias
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
        >
          + Nueva Franquicia
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar franquicia..."
        className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
              <th className="px-4 py-3.5 font-semibold">ID Franquicia</th>
              <th className="px-4 py-3.5 font-semibold">Nombre</th>
              <th className="px-4 py-3.5 font-semibold">Formato</th>
              <th className="px-4 py-3.5 font-semibold">Estado</th>
              <th className="w-48 px-4 py-3.5 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-200 first:border-t-0"
              >
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900">
                  {item.id}
                </td>
                <td className="px-4 py-3.5 text-slate-700">{item.name}</td>
                <td className="px-4 py-3.5 text-slate-700">{item.formato}</td>
                <td className="px-4 py-3.5">
                  {item.active ? (
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
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No se encontraron franquicias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NuevaFranquiciaModal
        open={modalOpen}
        formatos={formatos}
        onClose={() => setModalOpen(false)}
        onConfirm={crearFranquicia}
      />
    </main>
  )
}
