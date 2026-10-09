import { useEffect, useState } from 'react'
import type { CatalogData } from '../lib/api'

type Props = {
  title: string
  // e.g. "Formato" → "Nombre de Formato"
  entityLabel: string
  submitLabel: string
  initial?: CatalogData
  onClose: () => void
  onConfirm: (data: CatalogData) => Promise<void>
}

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function CatalogFormModal({
  title,
  entityLabel,
  submitLabel,
  initial = { name: '', active: true },
  onClose,
  onConfirm,
}: Props) {
  const [nombre, setNombre] = useState(initial.name)
  const [active, setActive] = useState(initial.active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const trimmed = nombre.trim()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    try {
      await onConfirm({ name: trimmed, active })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-0 bg-slate-900/50"
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-form-title"
        onSubmit={onSubmit}
        className="relative w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2
          id="catalog-form-title"
          className="m-0 mb-5 text-lg font-bold text-slate-900"
        >
          {title}
        </h2>

        <label
          htmlFor="catalog-nombre"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Nombre de {entityLabel}
        </label>
        <input
          id="catalog-nombre"
          // biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre..."
          className="mb-5 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <label
          htmlFor="catalog-estado"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Estado
        </label>
        <select
          id="catalog-estado"
          value={active ? 'activo' : 'inactivo'}
          onChange={(e) => setActive(e.target.value === 'activo')}
          className="mb-8 w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        {error && (
          <p className="m-0 mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!trimmed || saving}
            className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
