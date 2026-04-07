'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthShell from '@/components/auth/AuthShell'
import { useAuthLocale } from '@/components/auth/useAuthLocale'

const copy = {
  en: {
    badge: 'Set New Password',
    title: 'Finish the reset flow with a cleaner screen.',
    description: 'The reset step uses the same centered structure and bilingual support as the rest of the auth flow.',
    password: 'New password',
    confirmPassword: 'Confirm password',
    passwordPlaceholder: 'Enter your new password',
    confirmPlaceholder: 'Repeat your password',
    invalidPassword: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
    submit: 'Save new password',
    loading: 'Saving...',
    success: 'Password updated successfully.',
    back: 'Back to sign in',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    strength: 'Strength',
  },
  sq: {
    badge: 'Vendos Fjalëkalim të Ri',
    title: 'Përfundo rikthimin me një ekran më të pastër.',
    description: 'Hapi i reset përdor të njëjtin layout të përqendruar dhe mbështetje dygjuhëshe si pjesa tjetër e auth flow.',
    password: 'Fjalëkalimi i ri',
    confirmPassword: 'Konfirmo fjalëkalimin',
    passwordPlaceholder: 'Shkruaj fjalëkalimin e ri',
    confirmPlaceholder: 'Përsërite fjalëkalimin',
    invalidPassword: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.',
    mismatch: 'Fjalëkalimet nuk përputhen.',
    submit: 'Ruaj fjalëkalimin e ri',
    loading: 'Duke ruajtur...',
    success: 'Fjalëkalimi u përditësua me sukses.',
    back: 'Kthehu te hyrja',
    weak: 'E dobët',
    medium: 'Mesatare',
    strong: 'E fortë',
    strength: 'Forca',
  },
} as const

export default function ResetPassword() {
  const { locale, setLocale } = useAuthLocale()
  const t = copy[locale]
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const strengthLabel = strength <= 1 ? t.weak : strength <= 3 ? t.medium : t.strong

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
    setLoading(false)
    setTimeout(() => router.push('/login?message=password-updated'), 1500)
  }

  return (
    <AuthShell
      locale={locale}
      onLocaleChange={setLocale}
      badge={t.badge}
      title={t.title}
      description={t.description}
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:opacity-80">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      }
    >
      <div className="space-y-4">
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
              <Lock className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                className="field-input pl-14 pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-900 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.strength}:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{strengthLabel}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t.confirmPlaceholder}
                className="field-input pl-14 pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-900 dark:hover:text-white"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || password !== confirmPassword}
            className="primary-button w-full justify-center py-3.5 text-sm"
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
    </AuthShell>
  )
}
