import { useEffect, useState } from 'react'
import type { Formato } from '../lib/api'

type Props = {
  open: boolean
  formatos: Formato[]
  onClose: () => void
  onConfirm: (nombre: string, formato: string) => void
}

const fieldClass =
  'w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default function NuevaFranquiciaModal({
  open,
  formatos,
  onClose,
  onConfirm,
}: Props) {
  const [nombre, setNombre] = useState('')
  const [formato, setFormato] = useState('')

  useEffect(() => {
    if (open) {
      setNombre('')
      setFormato('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const trimmed = nombre.trim()
  const canSubmit = trimmed !== '' && formato !== ''

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
        aria-labelledby="nueva-franquicia-title"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onConfirm(trimmed, formato)
        }}
        className="relative w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2
          id="nueva-franquicia-title"
          className="m-0 mb-5 text-lg font-bold text-slate-900"
        >
          Nueva Franquicia
        </h2>

        <label
          htmlFor="franquicia-nombre"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Nombre de Franquicia
        </label>
        <input
          id="franquicia-nombre"
          // biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre..."
          className={`mb-5 ${fieldClass}`}
        />

        <label
          htmlFor="franquicia-formato"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Formato
        </label>
        <select
          id="franquicia-formato"
          value={formato}
          onChange={(e) => setFormato(e.target.value)}
          className={`mb-5 ${fieldClass} ${formato === '' ? 'text-slate-500' : ''}`}
        >
          <option value="">Seleccione un formato...</option>
          {formatos
            .filter((f) => f.active)
            .map((f) => (
              <option key={f.id} value={f.name}>
                {f.name}
              </option>
            ))}
        </select>

        <label
          htmlFor="franquicia-estado"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Estado
        </label>
        {/* New franquicias always start as active */}
        <input
          id="franquicia-estado"
          value="Activo"
          disabled
          className="mb-8 w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700"
        />

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
            disabled={!canSubmit}
            className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar Registro
          </button>
        </div>
      </form>
    </div>
  )
}
