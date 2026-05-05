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
  size?: 'default' | 'wide'
  align?: 'center' | 'start'
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
  size = 'default',
  align = 'center',
}: AuthShellProps) {
  const isCompact = variant === 'compact'
  const panelWidth = size === 'wide' ? 'max-w-[42rem]' : 'max-w-[34rem]'
  const contentAlign =
    align === 'start'
      ? 'items-start pt-0 sm:pt-1'
      : 'items-center pt-3'

  return (
    <div className="relative grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 py-3 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.22),transparent_46%)] dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_42%)]" />
      <div className="pointer-events-none absolute left-[-10rem] top-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-300/10" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-5rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-300/10" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-3 rounded-full px-1 py-1">
          <span className="icon-shell h-10 w-10 text-[var(--accent)]">
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

      <div className={`relative mx-auto flex min-h-0 w-full max-w-5xl justify-center ${contentAlign}`}>
        <section className={`surface w-full ${panelWidth} max-h-full ${isCompact ? 'p-4' : 'p-5 sm:p-6'}`}>
          <span className="eyebrow">{badge}</span>
          <h1 className={`max-w-2xl font-semibold tracking-tight text-slate-900 dark:text-white ${isCompact ? 'mt-1.5 text-[1.5rem] leading-tight sm:text-[1.65rem]' : 'mt-3 text-[1.7rem] leading-tight sm:text-[2rem]'}`}>
            {title}
          </h1>
          <p className={`max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400 ${isCompact ? 'mt-1' : 'mt-2'}`}>
            {description}
          </p>

          <div className={isCompact ? 'mt-3' : 'mt-5'}>{children}</div>

          {footer ? (
            <div className={`border-t border-[var(--border)] ${isCompact ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
