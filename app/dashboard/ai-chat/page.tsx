'use client'

import { Suspense } from 'react'
import { Bot } from 'lucide-react'
import AIChatCard from '@/components/dashboard/AIChatCard'

export default function AIChatPage() {
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 pb-4">
      <section className="surface-muted animate-fadeInScale flex items-center gap-3 px-4 py-3 sm:px-5">
        <div className="icon-shell h-10 w-10 text-[var(--accent)]">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <span className="eyebrow">General mode</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            AI study chat
          </h1>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="surface flex min-h-64 items-center justify-center">
            <span className="spinner-arc h-8 w-8" />
          </div>
        }
      >
        <AIChatCard />
      </Suspense>
    </div>
  )
}
