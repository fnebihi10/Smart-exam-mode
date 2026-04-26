'use client'

import { BadgeCheck, Mail, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    title: 'Your study profile',
    active: 'Active account',
    email: 'Email',
    noEmail: 'No email found',
    noteTitle: 'Cleaner dashboard structure',
    noteBody: 'Profile details stay lightweight here, while materials live in the dedicated Lectures area.',
  },
  sq: {
    title: 'Profili yt i studimit',
    active: 'Llogari aktive',
    email: 'Email',
    noEmail: 'Nuk u gjet email',
    noteTitle: 'Strukture me e paster',
    noteBody: 'Profili qendron i thjeshte ketu, ndersa materialet jane vetem te faqja Leksionet.',
  },
} as const

export default function UserCard() {
  const { user } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <section className="surface animate-fade-in-up p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-xl font-semibold text-white shadow-[0_22px_34px_-24px_rgba(15,118,110,0.8)]">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{displayName}</h2>
                <BadgeCheck className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.title}</p>
            </div>
          </div>

          <span className="status-pill">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t.active}
          </span>
        </div>

        <div className="surface-muted flex items-start gap-4 p-4">
          <div className="icon-shell h-11 w-11 text-[var(--accent)]">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.email}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-slate-900 dark:text-white" title={user?.email}>
              {user?.email || t.noEmail}
            </p>
          </div>
        </div>

        <div className="surface-muted flex items-start gap-4 p-4">
          <div className="icon-shell h-11 w-11 text-slate-700 dark:text-slate-200">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.noteTitle}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t.noteBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
