'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'

const copy = {
  en: {
    back: 'Back to dashboard',
    title: 'Change password',
    description: 'This screen now follows the same visual system as the rest of the workspace.',
    security: 'Clearer security flow',
    securityBody: 'The form keeps only the steps that matter for changing the password.',
    password: 'New password',
    confirm: 'Confirm password',
    passwordPlaceholder: 'Enter the new password',
    confirmPlaceholder: 'Repeat the password',
    invalidPassword: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
    success: 'Password updated successfully.',
    submit: 'Update password',
    loading: 'Updating...',
  },
  sq: {
    back: 'Kthehu te dashboard',
    title: 'Ndrysho fjalekalimin',
    description: 'Kjo faqe ndjek te njejtin sistem vizual si pjesa tjeter e panelit.',
    security: 'Rrjedhe sigurie me e qarte',
    securityBody: 'Forma mban vetem hapat qe duhen per ndryshimin e fjalekalimit.',
    password: 'Fjalekalimi i ri',
    confirm: 'Konfirmo fjalekalimin',
    passwordPlaceholder: 'Shkruaj fjalekalimin e ri',
    confirmPlaceholder: 'Perserite fjalekalimin',
    invalidPassword: 'Fjalekalimi duhet te kete te pakten 6 karaktere.',
    mismatch: 'Fjalekalimet nuk perputhen.',
    success: 'Fjalekalimi u ndryshua me sukses.',
    submit: 'Perditeso fjalekalimin',
    loading: 'Duke perditesuar...',
  },
} as const

export default function ChangePassword() {
  const { locale } = useAppLocale()
  const t = useMemo(() => copy[locale], [locale])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()

  const strength = useMemo(() => {
    let score = 0
    if (password.length > 5) score += 1
    if (password.length > 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError(t.invalidPassword)
      return
    }

    if (password !== confirmPassword) {
      setError(t.mismatch)
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(t.success)
    setPassword('')
    setConfirmPassword('')
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1600)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <section className="surface animate-fade-in-up p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/dashboard" className="secondary-button px-4 py-2">
              {t.back}
            </Link>
            <h1 className="page-title mt-5 text-3xl md:text-4xl">{t.title}</h1>
            <p className="page-copy mt-4">{t.description}</p>
          </div>

          <div className="surface-muted p-4 sm:max-w-xs">
            <div className="icon-shell h-11 w-11 text-[var(--accent)]">
              <Shield className="h-4 w-4" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{t.security}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.securityBody}</p>
          </div>
        </div>
      </section>

      <section className="surface animate-fade-in-up p-6 sm:p-7">
        <div className="space-y-3">
          {success && (
            <div className="surface-muted flex items-start gap-3 border-emerald-200/70 bg-emerald-50/80 p-4 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm leading-6">{success}</p>
            </div>
          )}

          {error && (
            <div className="surface-muted flex items-start gap-3 border-rose-200/70 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm leading-6">{error}</p>
            </div>
          )}
        </div>

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="field-input pl-14 pr-4"
                  required
                />
              </div>

              {password.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className={`h-2 flex-1 rounded-full ${
                        strength >= level
                          ? 'bg-gradient-to-r from-[var(--accent)] to-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.confirm}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t.confirmPlaceholder}
                  className="field-input pl-14 pr-4"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="primary-button w-full justify-center"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t.loading}
                </>
              ) : (
                <>
                  {t.submit}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
