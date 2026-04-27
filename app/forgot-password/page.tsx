'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthShell from '@/components/auth/AuthShell'
import { useAuthLocale } from '@/components/auth/useAuthLocale'

const copy = {
  en: {
    badge: 'Password Recovery',
    title: 'Reset access with the same clean design.',
    description: 'This page keeps the same centered auth structure, with no extra panels and a clearer path back into the product.',
    email: 'Email',
    emailPlaceholder: 'name@email.com',
    invalidEmail: 'Enter a valid email address.',
    submit: 'Send reset link',
    loading: 'Sending...',
    back: 'Back to sign in',
    success: 'We sent you an email with the password reset link.',
  },
  sq: {
    badge: 'Rikthim Fjalëkalimi',
    title: 'Rikthe qasjen me të njëjtin dizajn të pastër.',
    description: 'Kjo faqe mban të njëjtin auth layout të përqendruar, pa panele shtesë dhe me një rrjedhë më të qartë.',
    email: 'Email',
    emailPlaceholder: 'emri@email.com',
    invalidEmail: 'Shkruaj një email të vlefshëm.',
    submit: 'Dërgo linkun',
    loading: 'Duke dërguar...',
    back: 'Kthehu te hyrja',
    success: 'Të dërguam një email me lidhjen për rikthimin e fjalëkalimit.',
  },
} as const

export default function ForgotPassword() {
  const { locale, setLocale } = useAuthLocale()
  const t = copy[locale]
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPasswordForEmail } = useAuth()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!email.includes('@') || !email.includes('.')) {
      setError(t.invalidEmail)
      return
    }

    setLoading(true)
    const { error: resetError } = await resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(t.success)
    setLoading(false)
  }

  return (
    <AuthShell
      locale={locale}
      onLocaleChange={setLocale}
      badge={t.badge}
      title={t.title}
      description={t.description}
      variant="compact"
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

          <button type="submit" disabled={loading} className="primary-button w-full justify-center py-3.5 text-sm">
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
