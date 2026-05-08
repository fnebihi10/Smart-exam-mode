"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties, useState } from 'react'
import { BookOpen, FileCheck2, GraduationCap, LayoutDashboard, LogOut, Radio, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    subtitle: 'Calmer study workspace',
    summary: 'Overview',
    lectures: 'Lectures',
    exams: 'Official exams',
    practice: 'Practice',
    liveExams: 'Live exams',
    admin: 'Admin',
    focused: 'Focused workflow',
    focusedBody: 'Navigation adapts to your role so each workspace keeps its own responsibilities.',
    logout: 'Sign out',
  },} as const

export default function Sidebar() {
  const { role, signOut } = useAuth()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const { locale } = useAppLocale()
  const t = copy[locale]

  const links =
    role === 'admin'
      ? [
          { name: t.summary, href: '/dashboard', icon: LayoutDashboard },
          { name: t.admin, href: '/dashboard/admin', icon: ShieldCheck },
        ]
      : role === 'teacher'
        ? [
            { name: t.summary, href: '/dashboard', icon: LayoutDashboard },
            { name: t.lectures, href: '/dashboard/lectures', icon: BookOpen },
            { name: t.exams, href: '/dashboard/exams', icon: FileCheck2 },
          ]
        : [
            { name: t.summary, href: '/dashboard', icon: LayoutDashboard },
            { name: t.lectures, href: '/dashboard/lectures', icon: BookOpen },
            { name: t.practice, href: '/dashboard/exams', icon: FileCheck2 },
            { name: t.liveExams, href: '/dashboard/live-exams', icon: Radio },
          ]

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-[17.25rem] overflow-hidden p-4">
      <div className="surface flex h-full min-h-0 flex-col border-r p-5 shadow-depth-xl backdrop-blur-[12px] animate-fadeInUp [border-right-color:var(--sidebar-edge)] [animation-delay:80ms] [animation-fill-mode:both]">
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="icon-shell h-10 w-10 text-[var(--accent)] shadow-depth-sm">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Smart Exam Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <div className="surface-muted mt-5 p-4 animate-fadeInScale [animation-delay:140ms] [animation-fill-mode:both]">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            {t.focused}
          </span>
          <p className="mt-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {t.focusedBody}
          </p>
        </div>

        <nav className="mt-3.5 min-h-0">
          <ul className="space-y-2">
            {links.map(({ name, href, icon: Icon }, index) => {
            const isActive = pathname === href

            return (
              <li
                key={href}
                style={{ '--i': index } as CSSProperties}
                className="animate-fadeInUp [animation-delay:calc(var(--i)*60ms+180ms)] [animation-fill-mode:both]"
              >
                <Link
                  href={href}
                  className={`group/nav relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-[transform,background-color,color,box-shadow,border-color] duration-300 ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-slate-900 shadow-[inset_0_0_0_1px_rgba(var(--color-primary-rgb),0.2),var(--shadow-sm)] dark:text-white'
                      : 'text-slate-600 hover:translate-x-[3px] hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-[var(--accent)]" />
                  )}
                  <div className={`icon-shell h-8 w-8 rounded-xl transition-[transform,box-shadow,background-color] duration-300 group-hover/nav:shadow-depth-sm ${
                    isActive
                      ? 'border-transparent bg-white/80 text-[var(--accent)] dark:bg-slate-900/80'
                      : 'border-[var(--border)] bg-white/50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{name}</span>
                </Link>
              </li>
            )
            })}
          </ul>
        </nav>

        <div className="mt-6 animate-fadeInUp [animation-delay:360ms] [animation-fill-mode:both]">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="secondary-button w-full justify-center"
          >
            {loggingOut ? (
              <span className="spinner-arc h-4 w-4" />
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
