import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createBrand } from '../../lib/api'

export const Route = createFileRoute('/marca/nueva')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = nombre.trim()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      await createBrand(trimmed)
      navigate({ to: '/marca' })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al registrar la marca',
      )
      setSaving(false)
    }
  }

  return (
    <main className="px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/marca"
          className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 no-underline transition hover:bg-slate-50 hover:text-slate-900"
        >
          &lt; Volver
        </Link>
        <h1 className="m-0 text-2xl font-bold text-slate-900">
          Registrar Nueva Marca
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label
          htmlFor="marca-nombre"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Nombre de Marca
        </label>
        <input
          id="marca-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre..."
          className="mb-5 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <label
          htmlFor="marca-estado"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Estado
        </label>
        {/* New brands always start as active */}
        <input
          id="marca-estado"
          value="Activo"
          disabled
          className="mb-8 w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700"
        />

        {error && (
          <p className="m-0 mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            to="/marca"
            className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 no-underline transition hover:bg-slate-50 hover:text-slate-900"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!trimmed || saving}
            className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Registrando...' : 'Confirmar Registro'}
          </button>
        </div>
      </form>
    </main>
  )
}
