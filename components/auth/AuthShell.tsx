'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import type { AppLocale } from '@/components/i18n/useAppLocale'

type AuthShellProps = {
  children: React.ReactNode
  locale: AppLocale
  onLocaleChange: (locale: AppLocale) => void
  badge: string
  title: string
  description: string
  footer?: React.ReactNode
}

export default function AuthShell({
  children,
  locale,
  onLocaleChange,
  badge,
  title,
  description,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-3 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.22),transparent_46%)] dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_42%)]" />
      <div className="pointer-events-none absolute left-[-10rem] top-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-300/10" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-5rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-300/10" />

      <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-3 rounded-full px-2 py-2">
          <span className="icon-shell h-11 w-11 text-[var(--accent)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Smart Exam Mode</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Auth</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} onChange={onLocaleChange} />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative mx-auto mt-3 flex max-w-5xl justify-center lg:mt-4 lg:h-[calc(100vh-6.5rem)] lg:items-start">
        <section className="surface w-full max-w-[34rem] p-5 sm:p-6 lg:p-7">
          <span className="eyebrow">{badge}</span>
          <h1 className="mt-4 text-[1.8rem] font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.15rem]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>

          <div className="mt-5">{children}</div>

          {footer ? <div className="mt-5 border-t border-[var(--border)] pt-4">{footer}</div> : null}
        </section>
      </div>
    </div>
  )
}
