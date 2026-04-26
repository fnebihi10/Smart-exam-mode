'use client'

import { FileText, Sparkles } from 'lucide-react'
import MaterialsCard from '@/components/dashboard/MaterialsCard'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    badge: 'Your academic archive',
    title: 'Upload and organize lecture materials in one dedicated place.',
    description: 'This page now owns the materials experience, instead of duplicating it inside the dashboard overview.',
    libraryTitle: 'Structured library',
    libraryBody: 'Each file has more breathing room, clearer metadata, and a stronger visual rhythm.',
    aiTitle: 'Foundation for AI',
    aiBody: 'Cleaner lecture organization also makes the AI workflow feel more reliable.',
  },
  sq: {
    badge: 'Arkiva jote akademike',
    title: 'Ngarko dhe organizo materialet e leksioneve ne nje zone te dedikuar.',
    description: 'Kjo faqe e mban te gjithe eksperiencen e materialeve, ne vend qe ta dubloje edhe ne dashboard.',
    libraryTitle: 'Biblioteke e strukturuar',
    libraryBody: 'Cdo material ka me shume frymemarrje vizuale, metadata me te lexueshme dhe ritem me te mire.',
    aiTitle: 'Baze per AI',
    aiBody: 'Organizimi me i qarte i leksioneve e ben edhe rrjedhen me AI me te qendrueshme.',
  },
} as const

export default function LecturesPage() {
  const { locale } = useAppLocale()
  const t = copy[locale]

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
      <section className="surface animate-fade-in-up p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <span className="eyebrow">{t.badge}</span>
            <h1 className="page-title-compact mt-4 max-w-3xl">{t.title}</h1>
            <p className="page-copy-compact mt-3">{t.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                <FileText className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{t.libraryTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.libraryBody}</p>
            </div>

            <div className="surface-muted p-4">
              <div className="icon-shell h-10 w-10 text-amber-600 dark:text-amber-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{t.aiTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.aiBody}</p>
            </div>
          </div>
        </div>
      </section>

      <MaterialsCard />
    </div>
  )
}
