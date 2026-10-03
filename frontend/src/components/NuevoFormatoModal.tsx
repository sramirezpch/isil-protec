import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (nombre: string) => void
}

export default function NuevoFormatoModal({ open, onClose, onConfirm }: Props) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (open) setNombre('')
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
        aria-labelledby="nuevo-formato-title"
        onSubmit={(e) => {
          e.preventDefault()
          if (trimmed) onConfirm(trimmed)
        }}
        className="relative w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2
          id="nuevo-formato-title"
          className="m-0 mb-5 text-lg font-bold text-slate-900"
        >
          Nuevo Formato
        </h2>

        <label
          htmlFor="formato-nombre"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Nombre de Formato
        </label>
        <input
          id="formato-nombre"
          // biome-ignore lint/a11y/noAutofocus: focus the only field when the modal opens
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre..."
          className="mb-5 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <label
          htmlFor="formato-estado"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Estado
        </label>
        {/* New formatos always start as active */}
        <input
          id="formato-estado"
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
            disabled={!trimmed}
            className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar Registro
          </button>
        </div>
      </form>
    </div>
  )
}
