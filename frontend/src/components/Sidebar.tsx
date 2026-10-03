import { Link } from '@tanstack/react-router'

// TanStack Router sets data-status="active" on the current route's link
const itemClass =
  'flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-slate-300 no-underline transition hover:bg-white/5 hover:text-white data-[status=active]:bg-indigo-500 data-[status=active]:font-semibold data-[status=active]:text-white data-[status=active]:shadow-[0_4px_14px_rgba(99,102,241,0.35)]'

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-50 shrink-0 flex-col overflow-y-auto bg-[#111827] md:flex">
      <Link
        to="/"
        className="flex items-center gap-2.5 border-b border-white/10 px-4.5 py-4 no-underline"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-[10px] font-bold text-white">
          ISIL
        </span>
        <span className="text-[15px] font-bold text-white">Inventario</span>
      </Link>

      <nav className="flex flex-col px-3 pb-6 pt-4">
        <p className="m-0 px-2.5 pb-2 pt-3 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          Catálogos
        </p>
        <Link to="/formato" className={itemClass}>
          <span aria-hidden="true">📐</span>
          Formatos
        </Link>
      </nav>
    </aside>
  )
}
