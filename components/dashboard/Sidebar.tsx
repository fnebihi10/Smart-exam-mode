"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, GraduationCap, LayoutDashboard, ListTodo, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    subtitle: 'Calmer study workspace',
    summary: 'Overview',
    lectures: 'Lectures',
    tasks: 'Tasks',
    focused: 'Focused workflow',
    focusedBody: 'Navigation keeps only the areas you use often, with less noise and better hierarchy.',
    status: 'Status',
    ready: 'Workspace is ready.',
    logout: 'Sign out',
  },
  sq: {
    subtitle: 'Hapesire studimi me e qete',
    summary: 'Permbledhje',
    lectures: 'Leksionet',
    tasks: 'Detyrat',
    focused: 'Workflow i fokusuar',
    focusedBody: 'Navigimi mban vetem zonat qe perdoren shpesh, me me pak zhurme dhe me shume qartesi.',
    status: 'Status',
    ready: 'Paneli eshte gati.',
    logout: 'Dil',
  },
} as const

export default function Sidebar() {
  const { signOut } = useAuth()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const { locale, setLocale } = useAppLocale()
  const t = copy[locale]

  const links = [
    { name: t.summary, href: '/dashboard', icon: LayoutDashboard },
    { name: t.lectures, href: '/dashboard/lectures', icon: BookOpen },
    { name: t.tasks, href: '/dashboard/tasks', icon: ListTodo },
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-[17.25rem] p-4">
      <div className="surface flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="icon-shell h-12 w-12 text-[var(--accent)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Smart Exam Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <div className="mt-4 flex justify-end">
          <LanguageToggle locale={locale} onChange={setLocale} />
        </div>

        <div className="surface-muted mt-6 p-4">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            {t.focused}
          </span>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t.focusedBody}
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {links.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-slate-900 shadow-[var(--shadow-soft)] dark:text-white'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  isActive
                    ? 'border-transparent bg-white/80 text-[var(--accent)] dark:bg-slate-900/80'
                    : 'border-[var(--border)] bg-white/50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.status}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {t.ready}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="secondary-button w-full justify-center"
          >
            {loggingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-rose-500" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {t.logout}
          </button>
        </div>
      </div>
    </aside>
  )
}
