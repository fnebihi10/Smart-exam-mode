'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { useAuthLocale } from '@/components/auth/useAuthLocale'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const copy = {
  en: {
    badge: 'Welcome Back',
    title: 'Sign in without the visual noise.',
    description:
      'A cleaner login flow with a centered layout, stronger structure, and support for both light and dark mode.',
    successFallback: 'Your password was updated. You can sign in now.',
    invalidEmail: 'Enter a valid email address.',
    invalidPassword: 'Password must be at least 6 characters.',
    invalidCredentials: 'Your credentials are incorrect.',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'name@email.com',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot password?',
    submit: 'Sign in',
    loading: 'Signing in...',
    noAccount: "Don't have an account?",
    createAccount: 'Create one',
  },
  sq: {
    badge: 'Mire se u ktheve',
    title: 'Hyr pa zhurme vizuale.',
    description:
      'Nje hyrje me e paster, me layout te perqendruar, hierarki me te forte dhe mbeshtetje per light dhe dark mode.',
    successFallback: 'Fjalekalimi u perditesua. Tani mund te hysh.',
    invalidEmail: 'Shkruaj nje email te vlefshem.',
    invalidPassword: 'Fjalekalimi duhet te kete te pakten 6 karaktere.',
    invalidCredentials: 'Kredencialet nuk jane te sakta.',
    email: 'Email',
    password: 'Fjalekalimi',
    emailPlaceholder: 'emri@email.com',
    passwordPlaceholder: 'Shkruaj fjalekalimin',
    forgotPassword: 'Harrove fjalekalimin?',
    submit: 'Hyr',
    loading: 'Duke hyre...',
    noAccount: 'Nuk ke llogari?',
    createAccount: 'Krijoje',
  },
} as const

function LoginForm() {
  const { locale, setLocale } = useAuthLocale()
  const t = copy[locale]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const supabase = useSupabaseBrowserClient()

  const resolvedMessage = useMemo(() => {
    if (!message) return ''
    if (message === 'password-updated') return t.successFallback
    return message
  }, [message, t.successFallback])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.includes('@') || !email.includes('.')) {
      setError(t.invalidEmail)
      return
    }

    if (password.length < 6) {
      setError(t.invalidPassword)
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? t.invalidCredentials
          : authError.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
          {t.noAccount}{' '}
          <Link
            href="/signup"
            className="font-semibold text-[var(--accent)] transition hover:opacity-80"
          >
            {t.createAccount}
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {resolvedMessage && (
          <div className="surface-muted flex items-start gap-3 border-emerald-200/70 bg-emerald-50/80 p-4 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">{resolvedMessage}</p>
          </div>
        )}

        {error && (
          <div className="surface-muted flex items-start gap-3 border-rose-200/70 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">{error}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleLogin} className="mt-6 space-y-5">
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              {t.forgotPassword}
            </Link>
          </div>
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
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
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

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="surface px-5 py-4">
            <span className="block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent)]" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
