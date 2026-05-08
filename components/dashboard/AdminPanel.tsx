'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpenCheck, Eye, GraduationCap, RefreshCcw, ShieldCheck, UserCog } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import {
  EXAM_CATEGORY_META,
  type GeneratedExam,
  type StoredExamRecord,
} from '@/types/exams'
import { roleLabels, type UserProfile, type UserRole } from '@/types/roles'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const copy = {
  en: {
    back: 'Back to dashboard',
    badge: 'Admin control',
    title: 'Manage teacher and student roles, then preview official exams.',
    description:
      'Admins cannot create or start exams from this area. This workspace is for role control and read-only exam inspection.',
    usersTitle: 'Users',
    usersBody: 'Assign teacher or student access.',
    examsTitle: 'Official exam previews',
    examsBody: 'Inspect official drafts and live exams without launching a student session.',
    loading: 'Loading admin data...',
    loadError: 'Admin data could not be loaded.',
    setupNotice: 'Run the updated supabase_setup.sql to create profiles and role policies.',
    retry: 'Retry',
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    currentRole: 'Current role',
    requestedRole: 'Requested',
    setTeacher: 'Make teacher',
    setStudent: 'Make student',
    lockedAdmin: 'Admin role',
    roleUpdated: 'Role updated.',
    roleUpdateError: 'Role update failed.',
    noUsers: 'No profiles found.',
    noExams: 'No official exams found.',
    preview: 'Preview',
    hidePreview: 'Hide preview',
    draft: 'Draft',
    published: 'Published',
    liveUntil: 'Live until',
    questions: 'Questions',
    points: 'Points',
    duration: 'Duration',
    teacherOnly: 'Admin access is required for this page.',
    correctAnswer: 'Correct answer',
    sampleAnswer: 'Sample answer',
  },} as const

const EXAM_COLUMNS =
  'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'

function AdminExamPreview({
  exam,
  labels,
}: {
  exam: GeneratedExam
  labels: {
    correctAnswer: string
    sampleAnswer: string
  }
}) {
  return (
    <div className="mt-4 space-y-3">
      {exam.questions.map((question, index) => (
        <article key={question.id || `${question.type}-${index}`} className="rounded-2xl border border-[var(--border)] bg-white/45 p-4 dark:bg-slate-950/35">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill">
              {index + 1}. {EXAM_CATEGORY_META[question.type].label}
            </span>
            <span className="status-pill">{question.points} pts</span>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900 dark:text-white">{question.prompt}</p>
          {question.type === 'multiple_choice' && (
            <p className="mt-3 text-sm text-[var(--accent)]">
              {labels.correctAnswer}: {question.correctAnswer}
            </p>
          )}
          {question.type === 'fill_in_blank' && (
            <p className="mt-3 text-sm text-[var(--accent)]">
              {labels.correctAnswer}: {question.correctAnswer}
            </p>
          )}
          {question.type === 'open_ended' && (
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {labels.sampleAnswer}: {question.sampleAnswer}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

export default function AdminPanel() {
  const { profile, refreshProfile, role, roleLoading, user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [exams, setExams] = useState<StoredExamRecord[]>([])
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [previewExamId, setPreviewExamId] = useState<string | null>(null)

  const fetchAdminData = useCallback(async () => {
    if (!user || role !== 'admin') {
      setProfiles([])
      setExams([])
      setLoadingAdmin(false)
      return
    }

    setLoadingAdmin(true)
    setError('')

    try {
      const [profilesResponse, examsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, role, requested_role, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('exams')
          .select(EXAM_COLUMNS)
          .eq('exam_kind', 'official')
          .order('created_at', { ascending: false }),
      ])

      if (profilesResponse.error) {
        throw new Error(profilesResponse.error.message)
      }

      if (examsResponse.error) {
        throw new Error(examsResponse.error.message)
      }

      setProfiles((profilesResponse.data as UserProfile[]) || [])
      setExams((examsResponse.data as StoredExamRecord[]) || [])
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : t.loadError
      setError(
        message.toLowerCase().includes('profiles') ||
          message.toLowerCase().includes('schema cache') ||
          message.toLowerCase().includes('exam_kind')
          ? t.setupNotice
          : message
      )
    } finally {
      setLoadingAdmin(false)
    }
  }, [role, supabase, t.loadError, t.setupNotice, user])

  useEffect(() => {
    void fetchAdminData()
  }, [fetchAdminData])

  const profileMap = useMemo(
    () => new Map(profiles.map((entry) => [entry.id, entry])),
    [profiles]
  )

  const updateRole = async (target: UserProfile, nextRole: Exclude<UserRole, 'admin'>) => {
    if (target.role === 'admin') return

    setBusyUserId(target.id)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.rpc('admin_set_user_role', {
        target_user_id: target.id,
        next_role: nextRole,
      })

      if (error) {
        throw new Error(error.message)
      }

      const updatedProfile = data as UserProfile
      setProfiles((current) =>
        current.map((entry) => (entry.id === target.id ? updatedProfile : entry))
      )

      if (target.id === profile?.id) {
        await refreshProfile()
      }

      setSuccess(t.roleUpdated)
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t.roleUpdateError)
    } finally {
      setBusyUserId(null)
    }
  }

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

  if (role !== 'admin') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 pb-4">
        <section className="surface animate-fadeInScale p-6 sm:p-8">
          <Link href="/dashboard" className="secondary-button px-4 py-2">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <span className="eyebrow mt-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.badge}
          </span>
          <h1 className="page-title mt-5 max-w-3xl">{t.teacherOnly}</h1>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <section className="surface animate-fadeInScale p-6 sm:p-8 lg:p-10">
        <Link href="/dashboard" className="secondary-button px-4 py-2">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <span className="eyebrow mt-5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t.badge}
        </span>
        <h1 className="page-title mt-5 max-w-4xl">{t.title}</h1>
        <p className="page-copy mt-4 max-w-3xl">{t.description}</p>
      </section>

      {error && (
        <div className="surface-muted border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button type="button" onClick={() => void fetchAdminData()} className="secondary-button px-4 py-2">
              <RefreshCcw className="h-4 w-4" />
              {t.retry}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="surface-muted border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
          {success}
        </div>
      )}

      {loadingAdmin ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="spinner-arc h-6 w-6" />
            {t.loading}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="surface animate-fadeInScale overflow-hidden">
            <div className="card-header-divider px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.usersTitle}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.usersBody}</p>
            </div>

            {profiles.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">{t.noUsers}</div>
            ) : (
              <div className="space-y-3 p-5">
                {profiles.map((entry) => {
                  const isAdmin = entry.role === 'admin'
                  const displayName = entry.full_name || entry.email || entry.id

                  return (
                    <article key={entry.id} className="surface-muted p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                              {entry.role === 'teacher' ? (
                                <BookOpenCheck className="h-4 w-4" />
                              ) : entry.role === 'student' ? (
                                <GraduationCap className="h-4 w-4" />
                              ) : (
                                <ShieldCheck className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {displayName}
                              </h3>
                              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{entry.email || entry.id}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {t.currentRole}
                          </p>
                          <span className="status-pill mt-2">
                            {roleLabels[entry.role]}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {isAdmin ? (
                            <span className="secondary-button px-4 py-2">
                              <ShieldCheck className="h-4 w-4" />
                              {t.lockedAdmin}
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => void updateRole(entry, 'teacher')}
                                disabled={entry.role === 'teacher' || busyUserId === entry.id}
                                className="secondary-button px-4 py-2"
                              >
                                {busyUserId === entry.id ? (
                                  <span className="spinner-arc h-4 w-4" />
                                ) : (
                                  <UserCog className="h-4 w-4" />
                                )}
                                {t.setTeacher}
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateRole(entry, 'student')}
                                disabled={entry.role === 'student' || busyUserId === entry.id}
                                className="secondary-button px-4 py-2"
                              >
                                {busyUserId === entry.id ? (
                                  <span className="spinner-arc h-4 w-4" />
                                ) : (
                                  <GraduationCap className="h-4 w-4" />
                                )}
                                {t.setStudent}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="surface animate-fadeInScale overflow-hidden">
            <div className="card-header-divider px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.examsTitle}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.examsBody}</p>
            </div>

            {exams.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">{t.noExams}</div>
            ) : (
              <div className="space-y-4 p-5">
                {exams.map((exam) => {
                  const teacher = profileMap.get(exam.user_id)
                  const isPreviewing = previewExamId === exam.id

                  return (
                    <article key={exam.id} className="surface-muted p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{exam.title}</h3>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {teacher?.full_name || teacher?.email || exam.user_id}
                          </p>
                        </div>
                        <span className="status-pill">
                          {exam.status === 'draft' ? t.draft : t.published}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.questions}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.question_count}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.points}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.total_points}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.duration}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{exam.estimated_duration_minutes}m</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span>{t.liveUntil}</span>
                        <span>{formatDate(exam.live_until)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewExamId(isPreviewing ? null : exam.id)}
                        className="secondary-button mt-5 w-full justify-center"
                      >
                        <Eye className="h-4 w-4" />
                        {isPreviewing ? t.hidePreview : t.preview}
                      </button>

                      {isPreviewing && (
                        <AdminExamPreview
                          exam={exam.exam_payload}
                          labels={{
                            correctAnswer: t.correctAnswer,
                            sampleAnswer: t.sampleAnswer,
                          }}
                        />
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
