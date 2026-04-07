'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bot, CheckCircle2, FileText, GraduationCap, Sparkles } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import { useAuth } from '@/contexts/AuthContext'

const copy = {
  en: {
    subtitle: 'Clearer study flow',
    login: 'Sign in',
    signup: 'Create account',
    badge: 'Modern academic workspace',
    title: 'Study with focus, manage materials, and ask AI without getting lost in visual noise.',
    description: 'Smart Exam Mode brings lecture materials, an AI assistant, and a cleaner working panel into one place.',
    start: 'Get started',
    existing: 'I already have an account',
    highlightsTitle: 'What you get immediately',
    highlightsBody: 'Less visual noise, more orientation.',
    matureTitle: 'Sharper product direction',
    matureBody: 'Clearer hierarchy, better pacing, and more stable components.',
    example: 'Example',
    examplePrompt: 'Summarize the chapter about CPU architecture in key points.',
    exampleReply: 'AI responds with core concepts, simplified explanation, and direction for the next questions.',
    formats: 'Supported formats',
    use: 'Use case',
    feeling: 'Feeling',
    materials: 'Organized materials',
    materialsBody: 'Upload PDF, DOCX, and TXT files into one manageable place.',
    assistant: 'Ready assistant',
    assistantBody: 'Ask in natural language and get focused answers based on your materials.',
    flow: 'Study workflow',
    flowBody: 'Moving from uploads to exam prep feels direct and easier to follow.',
    loading: 'Preparing your study workspace...',
  },
  sq: {
    subtitle: 'Studim me i qarte',
    login: 'Hyr',
    signup: 'Krijo llogari',
    badge: 'Hapesire akademike moderne',
    title: 'Meso me fokus, menaxho materialet dhe pyet AI pa u humbur ne zhurme vizuale.',
    description: 'Smart Exam Mode bashkon materialet e leksioneve, asistentin AI dhe nje panel me te paster ne nje vend te vetem.',
    start: 'Fillo tani',
    existing: 'Kam llogari ekzistuese',
    highlightsTitle: 'Cfare fiton menjehere',
    highlightsBody: 'Me pak zhurme vizuale, me shume orientim.',
    matureTitle: 'Drejtim me i pjekur',
    matureBody: 'Hierarki me e qarte, ritem me i mire dhe komponente me te qendrueshem.',
    example: 'Shembull',
    examplePrompt: 'Permblidh kapitullin mbi arkitekturen e CPU-se ne pika kryesore.',
    exampleReply: 'AI pergjigjet me koncepte, shpjegim te thjeshtuar dhe drejtim per pyetjet e radhes.',
    formats: 'Formatet',
    use: 'Perdorimi',
    feeling: 'Ndjesia',
    materials: 'Materiale te organizuara',
    materialsBody: 'Ngarko PDF, DOCX dhe TXT ne nje hapesire te qarte dhe te menaxhueshme.',
    assistant: 'Asistent i gatshem',
    assistantBody: 'Pyet me gjuhe natyrale dhe merr pergjigje te fokusuara mbi materialet e tua.',
    flow: 'Rrjedhe studimi',
    flowBody: 'Kalimi nga ngarkimi i leksioneve te pergatitja per provim ndihet me i drejtperdrejte.',
    loading: 'Duke pergatitur ambientin tend te studimit...',
  },
} as const

export default function Home() {
  const { locale, setLocale } = useAppLocale()
  const t = useMemo(() => copy[locale], [locale])
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [loading, router, user])

  const highlights = [
    { title: t.materials, description: t.materialsBody, icon: FileText },
    { title: t.assistant, description: t.assistantBody, icon: Bot },
    { title: t.flow, description: t.flowBody, icon: GraduationCap },
  ]

  const metrics = [
    { label: t.formats, value: 'PDF, DOCX, TXT' },
    { label: t.use, value: 'Materials + AI Q&A' },
    { label: t.feeling, value: locale === 'en' ? 'Less noise, more focus' : 'Me pak zhurme, me shume fokus' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface flex items-center gap-3 px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent)]" />
          {t.loading}
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span className="icon-shell h-11 w-11 text-[var(--accent)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            <span className="block">Smart Exam Mode</span>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{t.subtitle}</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} onChange={setLocale} />
          <ThemeToggle />
          <Link href="/login" className="secondary-button">
            {t.login}
          </Link>
          <Link href="/signup" className="primary-button">
            {t.signup}
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section className="surface animate-fade-in-up p-8 sm:p-10 lg:p-14">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            {t.badge}
          </span>

          <h1 className="page-title mt-6 max-w-3xl">{t.title}</h1>
          <p className="page-copy mt-6">{t.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="primary-button">
              {t.start}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="secondary-button">
              {t.existing}
            </Link>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="surface animate-fade-in-up p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.highlightsTitle}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.highlightsBody}</p>
              </div>
              <div className="status-pill">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {highlights.map(({ title, description, icon: Icon }) => (
                <div key={title} className="surface-muted flex items-start gap-4 p-4">
                  <div className="icon-shell h-11 w-11 text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface animate-fade-in-up p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="icon-shell h-12 w-12 text-amber-600 dark:text-amber-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.matureTitle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.matureBody}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--highlight)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                {t.example}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p className="rounded-2xl bg-white/70 px-4 py-3 dark:bg-slate-900/70">{t.examplePrompt}</p>
                <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-slate-900 dark:text-slate-100">{t.exampleReply}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
