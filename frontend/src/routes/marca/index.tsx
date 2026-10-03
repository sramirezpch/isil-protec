import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogTable from '../../components/CatalogTable'
import { getBrands } from '../../lib/api'

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
  const [query, setQuery] = useState('')

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
        <Link
          to="/marca/nueva"
          className="rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-indigo-600 hover:text-white"
        >
          + Nueva Marca
        </Link>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar marca..."
        className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      <CatalogTable
        items={filtered}
        idLabel="ID Marca"
        emptyMessage="No se encontraron marcas."
      />
    </main>
  )
}
