'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  Crown,
  Eye,
  FileText,
  GraduationCap,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react'
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
    usersBadge: 'Admin control',
    previewsBadge: 'Exam previews',
    usersPageTitle: 'User role management',
    usersPageDescription:
      'Manage every account from one focused workspace. Promote users to student, professor, or admin, and remove accounts that should no longer have access.',
    previewsPageTitle: 'Exam preview',
    previewsPageDescription:
      'Inspect generated exams, timing, points, and questions without starting a student exam session.',
    usersTitle: 'Admin control',
    usersBody: 'Promote users to student, professor, or admin. Delete access when an account should leave the workspace.',
    examsTitle: 'Generated exam previews',
    examsBody: 'Review official exams created by professors, including status, timing, and full question previews.',
    loading: 'Loading admin data...',
    loadError: 'Admin data could not be loaded.',
    setupNotice: 'Run the updated supabase_setup.sql to create profiles and role policies.',
    retry: 'Retry',
    student: 'Student',
    teacher: 'Professor',
    admin: 'Admin',
    currentRole: 'Current role',
    requestedRole: 'Requested',
    setTeacher: 'Make professor',
    setStudent: 'Make student',
    setAdmin: 'Make admin',
    deleteUser: 'Delete',
    deletingUser: 'Deleting...',
    lockedAdmin: 'Admin role',
    roleUpdated: 'Role updated.',
    roleUpdateError: 'Role update failed.',
    userDeleted: 'User deleted.',
    userDeleteError: 'User deletion failed.',
    deleteConfirm: 'Delete this user and their workspace data? This cannot be undone.',
    searchPlaceholder: 'Search users by name, email, or role...',
    noUsers: 'No profiles found.',
    noSearchResults: 'No users match this search.',
    noExams: 'No official exams found.',
    preview: 'Preview',
    hidePreview: 'Hide preview',
    draft: 'Draft',
    published: 'Published',
    liveUntil: 'Live until',
    questions: 'Questions',
    points: 'Points',
    duration: 'Duration',
    singleChoice: 'Single choice',
    fillBlanks: 'Fill blanks',
    openEnded: 'Open ended',
    submissions: 'Submissions',
    options: 'Options',
    explanation: 'Explanation',
    gradingNotes: 'Grading notes',
    teacherOnly: 'Admin access is required for this page.',
    correctAnswer: 'Correct answer',
    sampleAnswer: 'Sample answer',
    totalUsers: 'Total users',
    professors: 'Professors',
    students: 'Students',
    admins: 'Admins',
    officialExams: 'Official exams',
    publishedExams: 'Published',
    latestExam: 'Latest exam',
    never: 'No exams yet',
    openUsers: 'Users',
    openPreviews: 'Exam previews',
    created: 'Created',
    all: 'All',
  },} as const

const EXAM_COLUMNS =
  'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'

const ATTEMPT_COLUMNS = 'id, exam_id'

type AdminView = 'users' | 'previews'

function normalizeExamPayload(payload: unknown): GeneratedExam | null {
  if (!payload) return null

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as GeneratedExam
      return Array.isArray(parsed.questions) ? parsed : null
    } catch {
      return null
    }
  }

  if (typeof payload !== 'object') return null

  const candidate = payload as Partial<GeneratedExam>
  return Array.isArray(candidate.questions) ? (candidate as GeneratedExam) : null
}

function AdminExamPreview({
  exam,
  labels,
}: {
  exam: GeneratedExam
  labels: {
    correctAnswer: string
    sampleAnswer: string
    options: string
    explanation: string
    gradingNotes: string
  }
}) {
  return (
    <div className="mt-5 space-y-4">
      {exam.questions.map((question, index) => (
        <article key={question.id || `${question.type}-${index}`} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white/70 shadow-depth-sm dark:bg-slate-950/35">
          <div className="flex flex-col gap-3 border-b border-[var(--surface-divider)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-pill">
                  {index + 1}. {EXAM_CATEGORY_META[question.type].label}
                </span>
                <span className="status-pill">{question.points} pts</span>
              </div>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-950 dark:text-white">{question.prompt}</p>
            </div>
          </div>

          {question.type === 'multiple_choice' && (
            <div className="space-y-4 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{labels.options}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = option === question.correctAnswer

                  return (
                    <div
                      key={`${question.id}-option-${optionIndex}`}
                      className={`flex min-h-12 items-center rounded-2xl border px-4 py-3 text-sm font-medium ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : 'border-[var(--border)] bg-white/45 text-slate-600 dark:bg-slate-950/25 dark:text-slate-300'
                      }`}
                    >
                      {option}
                    </div>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {labels.correctAnswer}: {question.correctAnswer}
                </p>
                {question.explanation && (
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {labels.explanation}: {question.explanation}
                  </p>
                )}
              </div>
            </div>
          )}
          {question.type === 'fill_in_blank' && (
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
                {labels.correctAnswer}: {question.correctAnswer}
              </p>
              {question.explanation && (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {labels.explanation}: {question.explanation}
                </p>
              )}
            </div>
          )}
          {question.type === 'open_ended' && (
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-2xl border border-[var(--border)] bg-white/55 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-950/25 dark:text-slate-300">
                {labels.sampleAnswer}: {question.sampleAnswer}
              </p>
              {question.gradingNotes.length > 0 && (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {labels.gradingNotes}: {question.gradingNotes.join('; ')}
                </p>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

export default function AdminPanel({ view = 'users' }: { view?: AdminView }) {
  const { profile, refreshProfile, role, roleLoading, user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [exams, setExams] = useState<StoredExamRecord[]>([])
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({})
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [previewExamId, setPreviewExamId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const isPreviewView = view === 'previews'

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
      const [profilesResponse, examsResponse, attemptsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, role, requested_role, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('exams')
          .select(EXAM_COLUMNS)
          .eq('exam_kind', 'official')
          .order('created_at', { ascending: false }),
        supabase
          .from('exam_attempts')
          .select(ATTEMPT_COLUMNS),
      ])

      if (profilesResponse.error) {
        throw new Error(profilesResponse.error.message)
      }

      if (examsResponse.error) {
        throw new Error(examsResponse.error.message)
      }

      if (attemptsResponse.error) {
        throw new Error(attemptsResponse.error.message)
      }

      const counts = ((attemptsResponse.data || []) as Array<{ exam_id: string }>).reduce<Record<string, number>>(
        (nextCounts, attempt) => {
          nextCounts[attempt.exam_id] = (nextCounts[attempt.exam_id] || 0) + 1
          return nextCounts
        },
        {}
      )

      setProfiles((profilesResponse.data as UserProfile[]) || [])
      setExams((examsResponse.data as StoredExamRecord[]) || [])
      setAttemptCounts(counts)
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

  const formatDate = useCallback((date: string | null) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [])

  const profileMap = useMemo(
    () => new Map(profiles.map((entry) => [entry.id, entry])),
    [profiles]
  )

  const filteredProfiles = useMemo(() => {
    const query = userSearch.trim().toLowerCase()

    if (!query) return profiles

    return profiles.filter((entry) =>
      [
        entry.full_name,
        entry.email,
        entry.role,
        entry.requested_role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [profiles, userSearch])

  const updateRole = async (target: UserProfile, nextRole: UserRole) => {
    if (target.id === profile?.id && nextRole !== 'admin') return

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

  const deleteUser = async (target: UserProfile) => {
    if (target.id === profile?.id) return

    const confirmed = window.confirm(t.deleteConfirm)
    if (!confirmed) return

    setDeletingUserId(target.id)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: target.id,
      })

      if (error) {
        throw new Error(error.message)
      }

      setProfiles((current) => current.filter((entry) => entry.id !== target.id))
      setExams((current) => current.filter((exam) => exam.user_id !== target.id))
      setSuccess(t.userDeleted)
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t.userDeleteError)
    } finally {
      setDeletingUserId(null)
    }
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
        <section className="surface animate-fadeInScale p-5 sm:p-6">
          <span className="eyebrow mt-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.badge}
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{t.teacherOnly}</h1>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1120px] space-y-4 pb-4">
      <div className="surface-muted animate-fadeInScale flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="icon-shell h-10 w-10 text-[var(--accent)]">
            {isPreviewView ? <FileText className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <span className="eyebrow">{isPreviewView ? t.previewsBadge : t.usersBadge}</span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {isPreviewView ? t.previewsPageTitle : t.usersPageTitle}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin" className={isPreviewView ? 'secondary-button px-4 py-2' : 'primary-button px-4 py-2'}>
            {t.openUsers}
          </Link>
          <Link href="/dashboard/admin/previews" className={isPreviewView ? 'primary-button px-4 py-2' : 'secondary-button px-4 py-2'}>
            {t.openPreviews}
          </Link>
        </div>
      </div>

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
        <div className="space-y-5">
          {!isPreviewView && (
          <section className="surface animate-fadeInScale overflow-hidden">
            <div className="card-header-divider px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.usersTitle}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t.usersBody}</p>
                </div>
                <label className="relative block min-w-0 lg:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="field-input h-11 pl-11 pr-4"
                  />
                </label>
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">{t.noUsers}</div>
            ) : (
              <div className="space-y-2 p-3 sm:p-4">
                {filteredProfiles.map((entry) => {
                  const displayName = entry.full_name || entry.email || entry.id
                  const isSelf = entry.id === profile?.id
                  const isBusy = busyUserId === entry.id
                  const isDeleting = deletingUserId === entry.id

                  return (
                    <article key={entry.id} className="rounded-2xl border border-[var(--border)] bg-white/48 px-3 py-3 shadow-depth-sm dark:bg-slate-950/25">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="icon-shell h-10 w-10 shrink-0 text-[var(--accent)]">
                            {entry.role === 'teacher' ? (
                              <BookOpenCheck className="h-4 w-4" />
                            ) : entry.role === 'student' ? (
                              <GraduationCap className="h-4 w-4" />
                            ) : (
                              <Crown className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {displayName}
                              </h3>
                              {isSelf && <span className="status-pill">You</span>}
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{entry.email || entry.id}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                          <span className="status-pill justify-center sm:w-24">
                            {roleLabels[entry.role]}
                          </span>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {[
                              { role: 'student' as const, label: t.student, icon: GraduationCap },
                              { role: 'teacher' as const, label: t.teacher, icon: UserCog },
                              { role: 'admin' as const, label: t.admin, icon: Crown },
                            ].map(({ role: nextRole, label, icon: RoleIcon }) => {
                              const selected = entry.role === nextRole

                              return (
                                <button
                                  key={nextRole}
                                  type="button"
                                  onClick={() => void updateRole(entry, nextRole)}
                                  disabled={selected || isBusy || isDeleting || (isSelf && nextRole !== 'admin')}
                                  className={`inline-flex min-w-[7.25rem] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-depth-sm transition ${
                                    selected
                                      ? nextRole === 'admin'
                                        ? 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                                        : 'border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                                      : 'border-[var(--border)] bg-white/60 text-slate-500 hover:-translate-y-0.5 hover:bg-white/80 hover:text-slate-900 dark:bg-slate-950/35 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-white'
                                  }`}
                                >
                                  {isBusy ? <span className="spinner-arc h-4 w-4" /> : <RoleIcon className="h-4 w-4" />}
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteUser(entry)}
                            disabled={isSelf || isBusy || isDeleting}
                            data-destructive="true"
                            className="secondary-button px-3 py-2 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50/70 dark:text-rose-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
                          >
                            {isDeleting ? <span className="spinner-arc h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                            {isDeleting ? t.deletingUser : t.deleteUser}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
                {filteredProfiles.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{t.noSearchResults}</div>
                )}
              </div>
            )}
          </section>
          )}

          {isPreviewView && (
          <section className="surface animate-fadeInScale overflow-hidden">
            <div className="card-header-divider flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.examsTitle}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.examsBody}</p>
              </div>
              <span className="status-pill self-start sm:self-auto">{exams.length} {t.officialExams.toLowerCase()}</span>
            </div>

            {exams.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">{t.noExams}</div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">
                {exams.map((exam) => {
                  const teacher = profileMap.get(exam.user_id)
                  const isPreviewing = previewExamId === exam.id
                  const previewPayload = normalizeExamPayload(exam.exam_payload)
                  const submissions = attemptCounts[exam.id] || 0
                  const questionCounts = previewPayload
                    ? {
                        single: previewPayload.questions.filter((question) => question.type === 'multiple_choice').length,
                        blanks: previewPayload.questions.filter((question) => question.type === 'fill_in_blank').length,
                        open: previewPayload.questions.filter((question) => question.type === 'open_ended').length,
                      }
                    : null

                  return (
                    <article key={exam.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white/58 shadow-depth-sm dark:bg-slate-950/25">
                      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{exam.title}</h3>
                            <span className="status-pill">{exam.status === 'draft' ? t.draft : t.published}</span>
                            <span className="status-pill">{exam.difficulty}</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {teacher?.full_name || teacher?.email || exam.user_id}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewExamId(isPreviewing ? null : exam.id)}
                          className="primary-button min-h-10 px-4 py-2 text-xs"
                        >
                          <Eye className="h-4 w-4" />
                          {isPreviewing ? t.hidePreview : t.preview}
                        </button>
                      </div>

                      <div className="grid gap-2 border-t border-[var(--surface-divider)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-7">
                        {[
                          { label: t.questions, value: exam.question_count },
                          { label: t.singleChoice, value: questionCounts?.single ?? '-' },
                          { label: t.fillBlanks, value: questionCounts?.blanks ?? '-' },
                          { label: t.openEnded, value: questionCounts?.open ?? '-' },
                          { label: t.points, value: exam.total_points },
                          { label: t.duration, value: `${exam.estimated_duration_minutes}m` },
                          { label: t.submissions, value: submissions },
                        ].map((metric) => (
                          <div key={metric.label} className="rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 dark:bg-slate-950/35">
                            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{metric.label}</p>
                            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{metric.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 border-t border-[var(--surface-divider)] px-4 py-3 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className="status-pill">{t.created}: {formatDate(exam.created_at)}</span>
                          <span className="status-pill">{t.liveUntil}: {formatDate(exam.live_until)}</span>
                        </div>
                        <span>{exam.exam_kind}</span>
                      </div>

                      {isPreviewing && previewPayload && (
                        <div className="border-t border-[var(--surface-divider)] px-4 pb-4">
                          <AdminExamPreview
                            exam={previewPayload}
                            labels={{
                              correctAnswer: t.correctAnswer,
                              sampleAnswer: t.sampleAnswer,
                              options: t.options,
                              explanation: t.explanation,
                              gradingNotes: t.gradingNotes,
                            }}
                          />
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
          )}
        </div>
      )}
    </div>
  )
}
