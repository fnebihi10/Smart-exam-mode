'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AuthShell from '@/components/auth/AuthShell'
import { useAuthLocale } from '@/components/auth/useAuthLocale'

const copy = {
  en: {
    badge: 'Create Account',
    title: 'A sharper signup flow, centered and clean.',
    description: 'No split layout, no filler panel, just a polished authentication screen with a stronger visual structure.',
    invalidName: 'Enter your full name.',
    invalidEmail: 'Enter a valid email address.',
    invalidPassword: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    namePlaceholder: 'e.g. Arta Berisha',
    emailPlaceholder: 'name@email.com',
    passwordPlaceholder: 'At least 6 characters',
    confirmPlaceholder: 'Repeat your password',
    submit: 'Create account',
    loading: 'Creating account...',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    strength: 'Strength',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    verifyNotice: 'Check your email after signup, then sign in.',
  },
  sq: {
    badge: 'Krijo Llogari',
    title: 'Një regjistrim më i pastër, i përqendruar dhe i rregullt.',
    description: 'Pa split layout, pa panel anësor të panevojshëm, vetëm një auth screen i strukturuar mirë dhe më profesional.',
    invalidName: 'Shkruaj emrin tënd të plotë.',
    invalidEmail: 'Shkruaj një email të vlefshëm.',
    invalidPassword: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.',
    mismatch: 'Fjalëkalimet nuk përputhen.',
    name: 'Emri i plotë',
    email: 'Email',
    password: 'Fjalëkalimi',
    confirmPassword: 'Konfirmo fjalëkalimin',
    namePlaceholder: 'p.sh. Arta Berisha',
    emailPlaceholder: 'emri@email.com',
    passwordPlaceholder: 'Minimumi 6 karaktere',
    confirmPlaceholder: 'Përsërite fjalëkalimin',
    submit: 'Krijo llogari',
    loading: 'Duke krijuar llogarinë...',
    haveAccount: 'Ke tashmë llogari?',
    signIn: 'Hyr',
    strength: 'Forca',
    weak: 'E dobët',
    medium: 'Mesatare',
    strong: 'E fortë',
    verifyNotice: 'Konfirmo email-in pas regjistrimit dhe më pas hyr.',
  },
} as const

export default function SignUp() {
  const { locale, setLocale } = useAuthLocale()
  const t = copy[locale]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError(t.invalidName)
      return
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError(t.invalidEmail)
      return
    }

    if (password.length < 6) {
      setError(t.invalidPassword)
      return
    }

    if (password !== confirmPassword) {
      setError(t.mismatch)
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(`/login?message=${encodeURIComponent(t.verifyNotice)}`)
  }

  return (
    <AuthShell
      locale={locale}
      onLocaleChange={setLocale}
      badge={t.badge}
      title={t.title}
      description={t.description}
      footer={
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.haveAccount}{' '}
          <Link href="/login" className="font-semibold text-[var(--accent)] transition hover:opacity-80">
            {t.signIn}
          </Link>
        </p>
      }
    >
      {error && (
        <div className="surface-muted flex items-start gap-3 border-rose-200/70 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-6">{error}</p>
        </div>
      )}

      <form onSubmit={handleSignUp} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t.name}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.namePlaceholder}
              className="field-input pl-14"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t.email}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.emailPlaceholder}
              className="field-input pl-14"
              required
            />
          </div>
        </div>

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
          disabled={loading || !name.trim() || password !== confirmPassword}
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
    </AuthShell>
  )
}
