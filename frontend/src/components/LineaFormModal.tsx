import { useEffect, useState } from 'react'

export type LineaFormData = {
  name: string
  marca: string
  active: boolean
}

type Props = {
  title: string
  submitLabel: string
  // Brand names offered in the "Marca" select
  marcas: string[]
  initial?: LineaFormData
  onClose: () => void
  onConfirm: (data: LineaFormData) => void
}

const fieldClass =
  'w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

// Selects use the gray background from the design
const selectClass =
  'w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function LineaFormModal({
  title,
  submitLabel,
  marcas,
  initial = { name: '', marca: '', active: true },
  onClose,
  onConfirm,
}: Props) {
  const [nombre, setNombre] = useState(initial.name)
  const [marca, setMarca] = useState(initial.marca)
  const [active, setActive] = useState(initial.active)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Keep the current brand selectable even if it's not in the list
  const options =
    initial.marca && !marcas.includes(initial.marca)
      ? [initial.marca, ...marcas]
      : marcas

  const trimmed = nombre.trim()
  const valid = trimmed !== '' && marca !== ''

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
        aria-labelledby="linea-form-title"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onConfirm({ name: trimmed, marca, active })
        }}
        className="relative w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2
          id="linea-form-title"
          className="m-0 mb-5 text-lg font-bold text-slate-900"
        >
          {title}
        </h2>

        <label
          htmlFor="linea-nombre"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Nombre de Línea
        </label>
        <input
          id="linea-nombre"
          // biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre..."
          className={`mb-5 ${fieldClass}`}
        />

        <label
          htmlFor="linea-marca"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Marca
        </label>
        <select
          id="linea-marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className={`mb-5 ${selectClass} ${marca ? 'text-slate-700' : 'text-slate-500'}`}
        >
          <option value="" disabled>
            Seleccione una marca...
          </option>
          {options.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <label
          htmlFor="linea-estado"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Estado
        </label>
        <select
          id="linea-estado"
          value={active ? 'activo' : 'inactivo'}
          onChange={(e) => setActive(e.target.value === 'activo')}
          className={`mb-8 ${selectClass} text-slate-700`}
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

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
            disabled={!valid}
            className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
