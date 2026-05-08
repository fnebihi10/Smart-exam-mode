'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Clock3, Play, Radio, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import type { StoredExamRecord } from '@/types/exams'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const copy = {
  en: {
    back: 'Back to dashboard',
    badge: 'Live official exams',
    title: 'Join official exams while the teacher window is open.',
    description:
      'Only published official exams that are still live appear here. When the teacher-selected time ends, the exam disappears.',
    loading: 'Checking live exams...',
    emptyTitle: 'No live exams right now',
    emptyBody: 'When a teacher publishes an official exam, it will show up here until the live window closes.',
    loadError: 'Live exams could not be loaded.',
    retry: 'Retry',
    questions: 'Questions',
    points: 'Points',
    duration: 'Duration',
    liveUntil: 'Live until',
    join: 'Join exam',
    studentOnly: 'Live official exams are only available to student accounts.',
  },} as const

const EXAM_COLUMNS =
  'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'

export default function LiveExamList() {
  const { role, roleLoading, user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const [exams, setExams] = useState<StoredExamRecord[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [error, setError] = useState('')

  const fetchLiveExams = useCallback(async () => {
    if (!user || role !== 'student') {
      setExams([])
      setLoadingExams(false)
      return
    }

    setLoadingExams(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('exams')
        .select(EXAM_COLUMNS)
        .eq('exam_kind', 'official')
        .eq('status', 'published')
        .gt('live_until', new Date().toISOString())
        .order('live_until', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      setExams((data as StoredExamRecord[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t.loadError)
    } finally {
      setLoadingExams(false)
    }
  }, [role, supabase, t.loadError, user])

  useEffect(() => {
    void fetchLiveExams()
  }, [fetchLiveExams])

  const formatDate = (date: string | null) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="spinner-arc h-8 w-8" />
      </div>
    )
  }

  if (role !== 'student') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 pb-4">
        <section className="surface animate-fadeInScale p-6 sm:p-8">
          <Link href="/dashboard" className="secondary-button px-4 py-2">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <span className="eyebrow mt-5">
            <Radio className="h-3.5 w-3.5" />
            {t.badge}
          </span>
          <h1 className="page-title mt-5 max-w-3xl">{t.studentOnly}</h1>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
      <section className="surface animate-fadeInScale p-6 sm:p-8 lg:p-10">
        <Link href="/dashboard" className="secondary-button px-4 py-2">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <span className="eyebrow mt-5">
          <Radio className="h-3.5 w-3.5" />
          {t.badge}
        </span>
        <h1 className="page-title mt-5 max-w-4xl">{t.title}</h1>
        <p className="page-copy mt-4 max-w-3xl">{t.description}</p>
      </section>

      {error && (
        <div className="surface-muted border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button type="button" onClick={() => void fetchLiveExams()} className="secondary-button px-4 py-2">
              <RefreshCcw className="h-4 w-4" />
              {t.retry}
            </button>
          </div>
        </div>
      )}

      <section className="surface animate-fadeInScale overflow-hidden">
        {loadingExams ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="spinner-arc h-8 w-8" />
            {t.loading}
          </div>
        ) : exams.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="icon-shell h-14 w-14 text-[var(--accent)]">
              <Clock3 className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{t.emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{t.emptyBody}</p>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {exams.map((exam) => (
              <article key={exam.id} className="surface-muted p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{exam.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {exam.description || exam.topic_focus || ' '}
                    </p>
                  </div>
                  <span className="status-pill">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {t.questions}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.question_count}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {t.points}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.total_points}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {t.duration}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.estimated_duration_minutes}m</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>{t.liveUntil}</span>
                  <span>{formatDate(exam.live_until)}</span>
                </div>

                <Link href={`/exam/${exam.id}`} className="primary-button mt-5 w-full justify-center">
                  <Play className="h-4 w-4" />
                  {t.join}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
