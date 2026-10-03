import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="mx-auto w-[min(1080px,calc(100%-2rem))] px-4 py-12">
      <section className="border border-line bg-linear-165 from-surface-strong to-surface shadow-island backdrop-blur-xs transition rounded-2xl p-6 sm:p-8">
        <p className="text-[0.69rem] font-bold uppercase tracking-[0.16em] text-kicker mb-2">About</p>
        <h1 className="font-display mb-3 text-4xl font-bold text-sea-ink sm:text-5xl">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-sea-ink-soft">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  )
}
