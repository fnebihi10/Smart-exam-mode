'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Play, Radio, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import type { StoredExamRecord } from '@/types/exams'
import { isAttemptForCurrentLiveSession } from '@/utils/examLiveSessions'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const copy = {
  en: {
    back: 'Back to dashboard',
    badge: 'Live official exams',
    title: 'Join official exams while the professor window is open.',
    description:
      'Only published official exams that are still live appear here. When the professor-selected time ends, the exam disappears.',
    loading: 'Checking live exams...',
    emptyTitle: 'No live exams right now',
    emptyBody: 'When a professor publishes an official exam, it will show up here until the live window closes.',
    available: 'Available',
    loadError: 'Live exams could not be loaded.',
    retry: 'Retry',
    questions: 'Questions',
    points: 'Points',
    duration: 'Duration',
    liveUntil: 'Live until',
    join: 'Join exam',
    completed: 'Completed',
    reviewResults: 'Review results',
    completedHint: 'You already submitted this exam during the current live session.',
    studentOnly: 'Live official exams are only available to student accounts.',
  },} as const

const EXAM_COLUMNS =
  'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'

const isAttemptTableMissing = (message: string) => {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('exam_attempts') &&
    (
      normalized.includes('does not exist') ||
      normalized.includes('schema cache') ||
      normalized.includes('could not find the table')
    )
  )
}

export default function LiveExamList() {
  const { role, roleLoading, user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const [exams, setExams] = useState<StoredExamRecord[]>([])
  const [completedExamIds, setCompletedExamIds] = useState<Set<string>>(new Set())
  const [loadingExams, setLoadingExams] = useState(true)
  const [error, setError] = useState('')

  const fetchLiveExams = useCallback(async () => {
    if (!user || role !== 'student') {
      setExams([])
      setCompletedExamIds(new Set())
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

      const nextExams = (data as StoredExamRecord[]) || []
      const examIds = nextExams.map((exam) => exam.id)
      let nextCompletedExamIds = new Set<string>()

      if (examIds.length > 0) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('exam_id, created_at, attempt_payload')
          .eq('user_id', user.id)
          .in('exam_id', examIds)

        if (attemptsError && !isAttemptTableMissing(attemptsError.message)) {
          throw new Error(attemptsError.message)
        }

        const examsById = new Map(nextExams.map((exam) => [exam.id, exam]))

        nextCompletedExamIds = new Set(
          ((attempts || []) as Array<{
            exam_id: string
            created_at: string
            attempt_payload: { liveSessionId?: string } | null
          }>)
            .filter((attempt) => {
              const exam = examsById.get(attempt.exam_id)
              return exam ? isAttemptForCurrentLiveSession(attempt, exam) : false
            })
            .map((attempt) => attempt.exam_id)
        )
      }

      setExams(nextExams)
      setCompletedExamIds(nextCompletedExamIds)
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

  const availableExamCount = exams.filter((exam) => !completedExamIds.has(exam.id)).length

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
    <div className="grid w-full gap-3 pb-3">
      <section className="surface animate-fadeInScale p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-stretch">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard" className="secondary-button px-4 py-2 text-xs">
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
              <span className="eyebrow">
                <Radio className="h-3.5 w-3.5" />
                {t.badge}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.35rem] sm:leading-[1.08]">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t.description}</p>
          </div>

          <aside className="grid grid-cols-2 gap-2 xl:grid-cols-1">
            <div className="rounded-xl border border-[var(--border)] bg-white/60 p-3 shadow-depth-sm dark:bg-slate-950/30">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{t.available}</p>
              <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{availableExamCount}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">{t.badge}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white/60 p-3 shadow-depth-sm dark:bg-slate-950/30">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{t.liveUntil}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{formatDate(exams[0]?.live_until || null)}</p>
            </div>
          </aside>
        </div>
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
            <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
              {exams.map((exam) => {
                const completed = completedExamIds.has(exam.id)

                return (
              <article key={exam.id} className={`surface-muted p-4 ${completed ? 'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-300/20 dark:bg-emerald-400/10' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{exam.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {exam.description || exam.topic_focus || ' '}
                    </p>
                  </div>
                  <span className="status-pill">
                    {completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    {completed ? t.completed : 'Live'}
                  </span>
                </div>

                {completed && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-50">
                    {t.completedHint}
                  </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {t.questions}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{exam.question_count}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {t.points}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{exam.total_points}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {t.duration}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{exam.estimated_duration_minutes}m</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t.liveUntil}</span>
                  <span>{formatDate(exam.live_until)}</span>
                </div>

                {completed ? (
                  <Link href="/dashboard/results" className="secondary-button mt-4 w-full justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.reviewResults}
                  </Link>
                ) : (
                  <Link href={`/exam/${exam.id}`} className="primary-button mt-4 w-full justify-center">
                    <Play className="h-4 w-4" />
                    {t.join}
                  </Link>
                )}
              </article>
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}
