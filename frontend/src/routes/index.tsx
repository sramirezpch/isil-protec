import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="px-6 py-6">
      <h1 className="m-0 text-xl font-bold text-slate-900">Dashboard General</h1>
    </main>
  )
}
