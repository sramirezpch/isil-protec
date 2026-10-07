type CatalogItem = {
  id: string
  name: string
  active: boolean
}

type Props<T extends CatalogItem> = {
  items: T[]
  emptyMessage: string
  onEdit?: (item: T) => void
}

export default function CatalogTable<T extends CatalogItem>({
  items,
  emptyMessage,
  onEdit,
}: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
            <th className="px-4 py-3.5 font-semibold">ID</th>
            <th className="px-4 py-3.5 font-semibold">Nombre</th>
            <th className="px-4 py-3.5 font-semibold">Estado</th>
            <th className="w-48 px-4 py-3.5 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-t border-slate-200 first:border-t-0"
            >
              <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900">
                {item.id}
              </td>
              <td className="px-4 py-3.5 text-slate-700">{item.name}</td>
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
                    onClick={() => onEdit?.(item)}
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
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
