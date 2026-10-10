import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import CatalogTable from '../components/CatalogTable'
import LineaFormModal, {
  type LineaFormData,
} from '../components/LineaFormModal'
import { getBrands, LINEAS_DE_PRUEBA, type Linea } from '../lib/api'

export const Route = createFileRoute('/linea')({
  // Brands come from the backend to fill the "Marca" select
  loader: () => getBrands(),
  component: RouteComponent,
  pendingComponent: () => (
    <main className="px-8 py-8 text-slate-500">Cargando líneas...</main>
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
  const marcas = brands.filter((b) => b.active).map((b) => b.name)

  // No linea endpoint yet: changes only live in local state
  const [lineas, setLineas] = useState<Linea[]>(LINEAS_DE_PRUEBA)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Linea | null>(null)

  const crearLinea = (data: LineaFormData) => {
    const next =
      Math.max(0, ...lineas.map((l) => Number(l.id.split('-')[1]))) + 1
    setLineas([
      ...lineas,
      { id: `LIN-${String(next).padStart(3, '0')}`, ...data },
    ])
    setCreating(false)
  }

  const editarLinea = (data: LineaFormData) => {
    if (!editing) return
    setLineas(lineas.map((l) => (l.id === editing.id ? { ...l, ...data } : l)))
    setEditing(null)
  }

  // Mirrors the other catalogs: deleting marks the linea as inactive
  const eliminarLinea = (linea: Linea) => {
    if (!window.confirm(`¿Eliminar la línea "${linea.name}"?`)) return
    setLineas(
      lineas.map((l) => (l.id === linea.id ? { ...l, active: false } : l)),
    )
  }

  const term = query.trim().toLowerCase()
  const filtered = lineas.filter(
    (l) =>
      l.name.toLowerCase().includes(term) ||
      l.id.toLowerCase().includes(term) ||
      l.marca.toLowerCase().includes(term),
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

      <CatalogTable
        items={filtered}
        emptyMessage="No se encontraron líneas."
        extraColumns={[{ header: 'Marca', render: (l) => l.marca }]}
        onEdit={setEditing}
        onDelete={eliminarLinea}
      />

      {creating && (
        <LineaFormModal
          title="Nueva Línea"
          submitLabel="Confirmar Registro"
          marcas={marcas}
          onClose={() => setCreating(false)}
          onConfirm={crearLinea}
        />
      )}

      {editing && (
        <LineaFormModal
          key={editing.id}
          title="Editar Línea"
          submitLabel="Guardar Cambios"
          marcas={marcas}
          initial={{
            name: editing.name,
            marca: editing.marca,
            active: editing.active,
          }}
          onClose={() => setEditing(null)}
          onConfirm={editarLinea}
        />
      )}
    </main>
  )
}
