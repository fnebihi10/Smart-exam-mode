'use client'

import Link from 'next/link'
import { BookOpen, FileCheck2, GraduationCap, LayoutDashboard, Radio, ShieldCheck } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import ThemeToggle from '@/components/ThemeToggle'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import { useAuth } from '@/contexts/AuthContext'

const copy = {
  en: {
    subtitle: 'Workspace',
    summary: 'Overview',
    lectures: 'Lectures',
    exams: 'Official exams',
    practice: 'Practice',
    liveExams: 'Live exams',
    admin: 'Admin',
  },} as const

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useAppLocale()
  const { role } = useAuth()
  const t = copy[locale]

  const mobileLinks =
    role === 'admin'
      ? [
          { href: '/dashboard', label: t.summary, icon: LayoutDashboard },
          { href: '/dashboard/admin', label: t.admin, icon: ShieldCheck },
        ]
      : role === 'teacher'
        ? [
            { href: '/dashboard', label: t.summary, icon: LayoutDashboard },
            { href: '/dashboard/lectures', label: t.lectures, icon: BookOpen },
            { href: '/dashboard/exams', label: t.exams, icon: FileCheck2 },
          ]
        : [
            { href: '/dashboard', label: t.summary, icon: LayoutDashboard },
            { href: '/dashboard/lectures', label: t.lectures, icon: BookOpen },
            { href: '/dashboard/exams', label: t.practice, icon: FileCheck2 },
            { href: '/dashboard/live-exams', label: t.liveExams, icon: Radio },
          ]

  return (
    <div className="min-h-screen px-3 py-3 sm:px-4 lg:px-5">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="lg:ml-[18.5rem]">
        <header className="surface mb-4 flex items-center justify-between px-4 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="icon-shell h-11 w-11 text-[var(--accent)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Smart Exam Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar lg:hidden">
          {mobileLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="surface-muted inline-flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Icon className="h-4 w-4 text-[var(--accent)]" />
              {label}
            </Link>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}
