'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Database,
  FileCheck2,
  FileStack,
  BarChart3,
  GraduationCap,
  Radio,
  ShieldCheck,
  Sparkles,
  UserCog,
} from 'lucide-react'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import { useAuth } from '@/contexts/AuthContext'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'
import {
  EXAM_BUILDER_LECTURE_COLUMNS,
  listLectureFiles,
  type LectureFileListItem,
} from '@/utils/lectureFiles'

const copy = {
  en: {
    adminBadge: 'Admin command center',
    adminTitle: 'Users, roles, and exams at a glance.',
    adminDescription: 'This dashboard is focused on operational work: role control, exam review, and quick checks before anyone enters exam mode.',
    professorBadge: 'Professor workspace',
    professorTitle: 'Lectures, official exams, and results at a glance.',
    professorDescription: 'Upload materials, generate official exams, publish live windows, and review student submissions from one clean starting point.',
    studentBadge: 'Student study center',
    studentTitle: 'Lectures, practice, and live exams at a glance.',
    studentDescription: 'Review professor materials, build private practice exams, join live official exams, and ask the study assistant when you need help.',
    users: 'Users',
    usersBody: 'Roles, access, and cleanup.',
    examPreview: 'Exam preview',
    examPreviewBody: 'Drafts and published exams.',
    aiChat: 'AI chat',
    aiChatBody: 'Ask focused study questions.',
    workspaceHealth: 'Workspace health',
    synced: 'Synced from Supabase',
    professors: 'Professors',
    students: 'Students',
    admins: 'Admins',
    published: 'Published',
    roleQueue: 'Role queue',
    roleQueueBody: 'Professor requests and account access.',
    pendingRequests: 'pending professor requests',
    examReview: 'Exam review',
    officialExams: 'Official exams',
    officialExamsBody: 'Draft, preview, publish, and review official exams.',
    officialExamsSystem: 'official exams in the system',
    latestExam: 'Latest exam',
    noExams: 'No exams yet',
    lectures: 'Lectures',
    lecturesBodyProfessor: 'Upload source material for official exam generation.',
    lecturesBodyStudent: 'Read professor-uploaded material before practice.',
    practice: 'Practice exams',
    practiceBody: 'Generate private revision papers from lectures.',
    liveExams: 'Live exams',
    liveExamsBody: 'Join official exams while the professor window is open.',
    results: 'Results',
    resultsBodyProfessor: 'Review submissions and score summaries.',
    resultsBodyStudent: 'Review your completed attempts.',
    profile: 'Profile',
    activeAccount: 'Active account',
    adminAccess: 'Admin access',
    professorAccess: 'Professor access',
    studentAccess: 'Student access',
    protectedAccess: 'Protected access',
    storedLectures: 'stored lectures',
    draftExams: 'drafts',
    publishedExams: 'published',
    attempts: 'attempts',
    availableNow: 'available now',
    openLectures: 'Open lectures',
    openExams: 'Open exams',
    openLiveExams: 'Open live exams',
    openResults: 'Open results',
    openAiChat: 'Open AI chat',
    roleManagement: 'Role management',
  },
} as const

type AdminSummary = {
  totalUsers: number
  professors: number
  students: number
  admins: number
  exams: number
  publishedExams: number
  pendingProfessorRequests: number
  latestExamDate: string | null
}

type RoleSummary = {
  lectures: number
  officialExams: number
  draftExams: number
  publishedExams: number
  practiceExams: number
  liveExams: number
  attempts: number
  latestExamDate: string | null
}

const emptyAdminSummary: AdminSummary = {
  totalUsers: 0,
  professors: 0,
  students: 0,
  admins: 0,
  exams: 0,
  publishedExams: 0,
  pendingProfessorRequests: 0,
  latestExamDate: null,
}

const emptyRoleSummary: RoleSummary = {
  lectures: 0,
  officialExams: 0,
  draftExams: 0,
  publishedExams: 0,
  practiceExams: 0,
  liveExams: 0,
  attempts: 0,
  latestExamDate: null,
}

const formatShortDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB') : copy.en.noExams

export default function Dashboard() {
  const { locale } = useAppLocale()
  const { profile, role, roleLoading, user } = useAuth()
  const supabase = useSupabaseBrowserClient()
  const t = copy[locale]
  const [adminSummary, setAdminSummary] = useState<AdminSummary>(emptyAdminSummary)
  const [roleSummary, setRoleSummary] = useState<RoleSummary>(emptyRoleSummary)

  useEffect(() => {
    if (!user || roleLoading || role !== 'admin') return

    const loadAdminSummary = async () => {
      const [profilesResponse, examsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, requested_role'),
        supabase
          .from('exams')
          .select('status, created_at')
          .eq('exam_kind', 'official')
          .order('created_at', { ascending: false }),
      ])

      const profiles = profilesResponse.data || []
      const exams = examsResponse.data || []

      setAdminSummary({
        totalUsers: profiles.length,
        professors: profiles.filter((entry) => entry.role === 'teacher').length,
        students: profiles.filter((entry) => entry.role === 'student').length,
        admins: profiles.filter((entry) => entry.role === 'admin').length,
        exams: exams.length,
        publishedExams: exams.filter((entry) => entry.status === 'published').length,
        pendingProfessorRequests: profiles.filter((entry) => entry.role === 'student' && entry.requested_role === 'teacher').length,
        latestExamDate: exams[0]?.created_at || null,
      })
    }

    void loadAdminSummary()
  }, [role, roleLoading, supabase, user])

  useEffect(() => {
    if (!user || roleLoading || role === 'admin') return

    const loadRoleSummary = async () => {
      const lecturePromise = listLectureFiles<LectureFileListItem>(
        supabase,
        user.id,
        EXAM_BUILDER_LECTURE_COLUMNS,
        role === 'teacher' ? 'own' : 'visible'
      ).catch(() => [])

      if (role === 'teacher') {
        const [lectures, examsResponse] = await Promise.all([
          lecturePromise,
          supabase
            .from('exams')
            .select('id, status, created_at')
            .eq('user_id', user.id)
            .eq('exam_kind', 'official')
            .order('created_at', { ascending: false }),
        ])

        const exams = examsResponse.data || []
        const examIds = exams.map((exam) => exam.id)
        let attempts = 0

        if (examIds.length) {
          const { data } = await supabase
            .from('exam_attempts')
            .select('id')
            .in('exam_id', examIds)

          attempts = data?.length || 0
        }

        setRoleSummary({
          lectures: lectures.length,
          officialExams: exams.length,
          draftExams: exams.filter((exam) => exam.status === 'draft').length,
          publishedExams: exams.filter((exam) => exam.status === 'published').length,
          practiceExams: 0,
          liveExams: 0,
          attempts,
          latestExamDate: exams[0]?.created_at || null,
        })
        return
      }

      const [lectures, practiceResponse, liveResponse, attemptsResponse] = await Promise.all([
        lecturePromise,
        supabase
          .from('exams')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('exam_kind', 'practice')
          .order('created_at', { ascending: false }),
        supabase
          .from('exams')
          .select('id')
          .eq('exam_kind', 'official')
          .eq('status', 'published')
          .gt('live_until', new Date().toISOString()),
        supabase
          .from('exam_attempts')
          .select('id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const practiceExams = practiceResponse.data || []
      const attempts = attemptsResponse.data || []

      setRoleSummary({
        lectures: lectures.length,
        officialExams: 0,
        draftExams: 0,
        publishedExams: 0,
        practiceExams: practiceExams.length,
        liveExams: liveResponse.data?.length || 0,
        attempts: attempts.length,
        latestExamDate: attempts[0]?.created_at || practiceExams[0]?.created_at || null,
      })
    }

    void loadRoleSummary()
  }, [role, roleLoading, supabase, user])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const isProfessor = role === 'teacher'
  const latestAdminExamLabel = formatShortDate(adminSummary.latestExamDate)
  const latestRoleDateLabel = formatShortDate(roleSummary.latestExamDate)

  const roleActions = useMemo(
    () =>
      isProfessor
        ? [
            { href: '/dashboard/lectures', title: t.lectures, body: t.lecturesBodyProfessor, icon: FileStack },
            { href: '/dashboard/exams', title: t.officialExams, body: t.officialExamsBody, icon: FileCheck2 },
            { href: '/dashboard/results', title: t.results, body: t.resultsBodyProfessor, icon: BarChart3 },
            { href: '/dashboard/ai-chat', title: t.aiChat, body: t.aiChatBody, icon: Bot },
          ]
        : [
            { href: '/dashboard/lectures', title: t.lectures, body: t.lecturesBodyStudent, icon: FileStack },
            { href: '/dashboard/exams', title: t.practice, body: t.practiceBody, icon: Sparkles },
            { href: '/dashboard/live-exams', title: t.liveExams, body: t.liveExamsBody, icon: Radio },
            { href: '/dashboard/results', title: t.results, body: t.resultsBodyStudent, icon: BarChart3 },
            { href: '/dashboard/ai-chat', title: t.aiChat, body: t.aiChatBody, icon: Bot },
          ],
    [isProfessor, t.aiChat, t.aiChatBody, t.lectures, t.lecturesBodyProfessor, t.lecturesBodyStudent, t.liveExams, t.liveExamsBody, t.officialExams, t.officialExamsBody, t.practice, t.practiceBody, t.results, t.resultsBodyProfessor, t.resultsBodyStudent]
  )

  if (role === 'admin') {
    return (
      <div className="grid w-full gap-3 pb-3">
        <section className="surface animate-fadeInScale p-4 sm:p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-stretch">
            <div>
              <span className="eyebrow">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.adminBadge}
              </span>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.45rem] sm:leading-[1.08]">{t.adminTitle}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t.adminDescription}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  { href: '/dashboard/admin', title: t.users, body: t.usersBody, icon: ShieldCheck },
                  { href: '/dashboard/admin/previews', title: t.examPreview, body: t.examPreviewBody, icon: FileCheck2 },
                  { href: '/dashboard/ai-chat', title: t.aiChat, body: t.aiChatBody, icon: Bot },
                ].map(({ href, title, body, icon: Icon }) => (
                  <Link key={href} href={href} className="dashboard-action-card group rounded-2xl border border-[var(--border)] bg-white/55 p-3 shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:bg-white/75 dark:bg-slate-950/25 dark:hover:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="icon-shell h-9 w-9 text-[var(--accent)] group-hover:border-[var(--accent)]/30">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--accent)] transition group-hover:translate-x-1" />
                    </div>
                    <h2 className="dashboard-action-title mt-3 text-sm dark:text-white">{title}</h2>
                    <p className="dashboard-action-copy mt-1 text-xs dark:text-slate-200">{body}</p>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="dashboard-health rounded-2xl border border-[var(--border)] bg-white/50 p-4 shadow-depth-sm dark:bg-slate-950/25">
              <div className="flex items-start gap-3">
                <div className="icon-shell h-10 w-10">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="dashboard-health-title text-base dark:text-white">{t.workspaceHealth}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{t.synced}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: t.users, value: adminSummary.totalUsers, detail: `${adminSummary.students} ${t.students}` },
                  { label: t.professors, value: adminSummary.professors, detail: `${adminSummary.pendingProfessorRequests} requests` },
                  { label: t.admins, value: adminSummary.admins, detail: t.protectedAccess },
                  { label: t.examPreview, value: adminSummary.exams, detail: `${adminSummary.publishedExams} ${t.published}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[var(--border)] bg-white/65 p-3 dark:bg-slate-950/35">
                    <p className="dashboard-stat-label text-[10px] uppercase tracking-[0.16em] dark:text-slate-200">{stat.label}</p>
                    <p className="dashboard-stat-value mt-1 text-xl dark:text-white">{stat.value}</p>
                    <p className="dashboard-stat-detail mt-1 text-[11px] uppercase dark:text-slate-200">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_1.15fr]">
          <div className="surface flex flex-col justify-between p-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                  <UserCog className="h-4 w-4" />
                </div>
                <span className="status-pill">{adminSummary.pendingProfessorRequests} requests</span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{t.roleQueue}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.roleQueueBody}</p>
              <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
                <p className="text-3xl font-semibold text-slate-950 dark:text-white">{adminSummary.pendingProfessorRequests}</p>
                <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{t.pendingRequests}</p>
              </div>
            </div>
            <Link href="/dashboard/admin" className="primary-button mt-4 min-h-11 w-full justify-between px-5 py-2.5 text-sm">
              {t.roleManagement}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="surface flex flex-col justify-between p-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <span className="status-pill">{adminSummary.publishedExams} published</span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{t.examReview}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.examPreviewBody}</p>
              <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
                <p className="text-3xl font-semibold text-slate-950 dark:text-white">{adminSummary.exams}</p>
                <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{t.officialExamsSystem}</p>
              </div>
            </div>
            <Link href="/dashboard/admin/previews" className="primary-button mt-4 min-h-11 w-full justify-between px-5 py-2.5 text-sm">
              {t.examPreview}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="surface grid gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-lg font-semibold text-white shadow-[0_20px_32px_-24px_rgba(15,118,110,0.8)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                  {t.adminAccess}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                  {t.latestExam}: {latestAdminExamLabel}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t.users, value: adminSummary.totalUsers },
                { label: t.professors, value: adminSummary.professors },
                { label: t.officialExams, value: adminSummary.exams },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--border)] bg-white/55 px-3 py-2 dark:bg-slate-950/25">
                  <p className="dashboard-stat-label text-[10px] uppercase tracking-[0.14em] dark:text-slate-200">{item.label}</p>
                  <p className="dashboard-stat-value mt-1 text-lg dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-3 pb-3">
      <section className="surface animate-fadeInScale p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-stretch">
          <div>
            <span className="eyebrow">
              {isProfessor ? <GraduationCap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isProfessor ? t.professorBadge : t.studentBadge}
            </span>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2.35rem] sm:leading-[1.08]">
              {isProfessor ? t.professorTitle : t.studentTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {isProfessor ? t.professorDescription : t.studentDescription}
            </p>

            <div className={`mt-5 grid gap-3 ${isProfessor ? 'md:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-5'}`}>
              {roleActions.map(({ href, title, body, icon: Icon }) => (
                <Link key={href} href={href} className="dashboard-action-card group rounded-2xl border border-[var(--border)] bg-white/55 p-3 shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:bg-white/75 dark:bg-slate-950/25 dark:hover:bg-slate-900/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="icon-shell h-9 w-9 text-[var(--accent)] group-hover:border-[var(--accent)]/30">
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)] transition group-hover:translate-x-1" />
                  </div>
                  <h2 className="dashboard-action-title mt-3 text-sm dark:text-white">{title}</h2>
                  <p className="dashboard-action-copy mt-1 text-xs leading-5 dark:text-slate-200">{body}</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="dashboard-health rounded-2xl border border-[var(--border)] bg-white/50 p-4 shadow-depth-sm dark:bg-slate-950/25">
            <div className="flex items-start gap-3">
              <div className="icon-shell h-10 w-10">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="dashboard-health-title text-base dark:text-white">{t.workspaceHealth}</h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{t.synced}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(isProfessor
                ? [
                    { label: t.lectures, value: roleSummary.lectures, detail: t.storedLectures },
                    { label: t.officialExams, value: roleSummary.officialExams, detail: `${roleSummary.publishedExams} ${t.publishedExams}` },
                    { label: t.results, value: roleSummary.attempts, detail: t.attempts },
                    { label: t.latestExam, value: roleSummary.draftExams, detail: t.draftExams },
                  ]
                : [
                    { label: t.lectures, value: roleSummary.lectures, detail: t.storedLectures },
                    { label: t.practice, value: roleSummary.practiceExams, detail: t.practiceBody },
                    { label: t.liveExams, value: roleSummary.liveExams, detail: t.availableNow },
                    { label: t.results, value: roleSummary.attempts, detail: t.attempts },
                  ]
              ).map((stat) => (
                <div key={stat.label} className="rounded-xl border border-[var(--border)] bg-white/65 p-3 dark:bg-slate-950/35">
                  <p className="dashboard-stat-label truncate text-[10px] uppercase tracking-[0.16em] dark:text-slate-200">{stat.label}</p>
                  <p className="dashboard-stat-value mt-1 text-xl dark:text-white">{stat.value}</p>
                  <p className="dashboard-stat-detail mt-1 truncate text-[11px] uppercase dark:text-slate-200">{stat.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr_1.15fr]">
        <div className="surface flex flex-col justify-between p-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                <FileStack className="h-4 w-4" />
              </div>
              <span className="status-pill">{roleSummary.lectures} {t.storedLectures}</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{t.lectures}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isProfessor ? t.lecturesBodyProfessor : t.lecturesBodyStudent}
            </p>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">{roleSummary.lectures}</p>
              <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{t.storedLectures}</p>
            </div>
          </div>
          <Link href="/dashboard/lectures" className="primary-button mt-4 min-h-11 w-full justify-between px-5 py-2.5 text-sm">
            {t.openLectures}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="surface flex flex-col justify-between p-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="icon-shell h-10 w-10 text-[var(--accent)]">
                {isProfessor ? <FileCheck2 className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
              </div>
              <span className="status-pill">
                {isProfessor ? `${roleSummary.publishedExams} ${t.publishedExams}` : `${roleSummary.liveExams} ${t.availableNow}`}
              </span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              {isProfessor ? t.officialExams : t.liveExams}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isProfessor ? t.officialExamsBody : t.liveExamsBody}
            </p>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                {isProfessor ? roleSummary.officialExams : roleSummary.liveExams}
              </p>
              <p className="text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                {isProfessor ? t.officialExamsBody : t.availableNow}
              </p>
            </div>
          </div>
          <Link href={isProfessor ? '/dashboard/exams' : '/dashboard/live-exams'} className="primary-button mt-4 min-h-11 w-full justify-between px-5 py-2.5 text-sm">
            {isProfessor ? t.openExams : t.openLiveExams}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="surface grid gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-lg font-semibold text-white shadow-[0_20px_32px_-24px_rgba(15,118,110,0.8)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{displayName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                {isProfessor ? t.professorAccess : t.studentAccess}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-3 dark:bg-slate-950/25">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                {t.latestExam}: {latestRoleDateLabel}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(isProfessor
              ? [
                  { label: t.officialExams, value: roleSummary.officialExams },
                  { label: t.published, value: roleSummary.publishedExams },
                  { label: t.results, value: roleSummary.attempts },
                ]
              : [
                  { label: t.practice, value: roleSummary.practiceExams },
                  { label: t.liveExams, value: roleSummary.liveExams },
                  { label: t.results, value: roleSummary.attempts },
                ]
            ).map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--border)] bg-white/55 px-3 py-2 dark:bg-slate-950/25">
                <p className="dashboard-stat-label truncate text-[10px] uppercase tracking-[0.14em] dark:text-slate-200">{item.label}</p>
                <p className="dashboard-stat-value mt-1 text-lg dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/results" className="secondary-button min-h-11 w-full justify-between px-5 py-2.5 text-sm">
            {t.openResults}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
