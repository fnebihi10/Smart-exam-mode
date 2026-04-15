'use client'

import Link from 'next/link'
import { type CSSProperties, useEffect, useState } from 'react'
import { ArrowRight, Bot, FileCheck2, FileStack, Sparkles } from 'lucide-react'
import AIChatCard from '@/components/dashboard/AIChatCard'
import UserCard from '@/components/dashboard/UserCard'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    badge: 'Your academic workspace',
    title: 'A calmer dashboard with clearer separation of responsibilities.',
    description: 'The dashboard focuses on profile context and AI work. Lecture materials now live only inside the dedicated Lectures screen, which keeps this page lighter and easier to scan.',
    materials: 'Materials',
    materialsValue: 'Moved to Lectures',
    assistant: 'Assistant',
    assistantValue: 'Ready for questions',
    exams: 'Exam builder',
    examsValue: 'AI draft + preview',
    approach: 'Approach',
    approachValue: 'Less noise, better structure',
    quickTitle: 'What changed',
    quickBody: 'The dashboard is no longer trying to be both a control center and a file library at the same time.',
    lecturesCta: 'Open Lectures',
    examsCta: 'Open Exams',
  },
  sq: {
    badge: 'Paneli yt akademik',
    title: 'Nje dashboard me i qete dhe me ndarje me te qarte te rolit te seciles zone.',
    description: 'Dashboard tani fokusohet te profili dhe puna me AI. Materialet e leksioneve jane vetem te faqja Leksionet, qe kjo faqe te mbetet me e lehte per t\'u lexuar.',
    materials: 'Materialet',
    materialsValue: 'Kaluan te Leksionet',
    assistant: 'Asistenti',
    assistantValue: 'Gati per pyetje',
    exams: 'Krijuesi i provimit',
    examsValue: 'Draft AI + preview',
    approach: 'Qasja',
    approachValue: 'Me pak zhurme, me shume strukture',
    quickTitle: 'Cfare ndryshoi',
    quickBody: 'Dashboard nuk po perpiqet me te jete edhe panel pune edhe biblioteke skedaresh ne te njejten kohe.',
    lecturesCta: 'Hap Leksionet',
    examsCta: 'Hap Provimet',
  },
} as const

export default function Dashboard() {
  const { locale } = useAppLocale()
  const t = copy[locale]
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const quickStats = [
    { title: t.materials, value: t.materialsValue, icon: FileStack, progress: 76 },
    { title: t.assistant, value: t.assistantValue, icon: Bot, progress: 88 },
    { title: t.exams, value: t.examsValue, icon: FileCheck2, progress: 71 },
    { title: t.approach, value: t.approachValue, icon: Sparkles, progress: 93 },
  ]

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-4">
      <section className="surface animate-fadeInScale p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow animate-fadeInUp [animation-delay:80ms] [animation-fill-mode:both]">{t.badge}</span>
            <h1 className="page-title mt-5 max-w-3xl animate-fadeInUp [animation-delay:140ms] [animation-fill-mode:both]">{t.title}</h1>
            <p className="page-copy mt-5">{t.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[36rem]">
            {quickStats.map(({ title, value, icon: Icon, progress }, index) => (
              <div
                key={title}
                style={{ '--i': index } as CSSProperties}
                className="surface-muted animate-fadeInUp p-4 [animation-delay:calc(var(--i)*80ms+220ms)] [animation-fill-mode:both]"
              >
                <div className="icon-shell h-11 w-11 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {title}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                <div className="mt-4 h-2 rounded-full bg-slate-200/70 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 transition-[width] duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: mounted ? `${progress}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.25fr]">
        <div className="space-y-5">
          <UserCard />

          <section className="surface animate-fadeInScale p-6 sm:p-7">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{t.quickTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.quickBody}</p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/dashboard/lectures" className="primary-button justify-center">
                {t.lecturesCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/exams" className="secondary-button justify-center">
                {t.examsCta}
              </Link>
            </div>
          </section>
        </div>

        <AIChatCard />
      </section>
    </div>
  )
}
