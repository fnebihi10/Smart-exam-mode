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
  variant?: 'default' | 'compact'
}

export default function AuthShell({
  children,
  locale,
  onLocaleChange,
  badge,
  title,
  description,
  footer,
  variant = 'default',
}: AuthShellProps) {
  const isCompact = variant === 'compact'

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 sm:px-6 lg:px-8 ${isCompact ? 'py-2 lg:py-3' : 'py-3 lg:py-4'}`}>
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

      <div className={`relative mx-auto flex max-w-5xl justify-center ${isCompact ? 'mt-2 lg:mt-2' : 'mt-3 lg:mt-4'}`}>
        <section className={`surface w-full max-w-[34rem] ${isCompact ? 'p-5 sm:p-6 lg:p-6' : 'p-5 sm:p-6 lg:p-7'}`}>
          <span className="eyebrow">{badge}</span>
          <h1 className={`font-semibold tracking-tight text-slate-900 dark:text-white ${isCompact ? 'mt-3 text-[1.7rem] sm:text-[1.95rem]' : 'mt-4 text-[1.8rem] sm:text-[2.15rem]'}`}>
            {title}
          </h1>
          <p className={`text-sm leading-6 text-slate-500 dark:text-slate-400 ${isCompact ? 'mt-2' : 'mt-3'}`}>
            {description}
          </p>

          <div className={isCompact ? 'mt-4' : 'mt-5'}>{children}</div>

          {footer ? (
            <div className={`border-t border-[var(--border)] ${isCompact ? 'mt-4 pt-3' : 'mt-5 pt-4'}`}>
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
