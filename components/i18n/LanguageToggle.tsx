'use client'

import { useEffect, useState } from 'react'
import type { AppLocale } from './useAppLocale'

type LanguageToggleProps = {
  locale: AppLocale
  onChange: (locale: AppLocale) => void
}

export default function LanguageToggle({ locale, onChange }: LanguageToggleProps) {
  const [animatedLocale, setAnimatedLocale] = useState<AppLocale>(locale)

  useEffect(() => {
    setAnimatedLocale(locale)
  }, [locale])

  return (
    <div className="inline-flex rounded-full border border-[var(--surface-border)] bg-white/60 p-1 shadow-depth-sm transition-shadow duration-300 dark:bg-slate-950/70">
      {(['en', 'sq'] as const).map((item) => {
        const active = item === locale

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              active
                ? `bg-slate-900 text-white shadow-depth-sm dark:bg-white dark:text-slate-950 ${
                    animatedLocale === item ? 'animate-success-pop' : ''
                  }`
                : 'text-slate-500 hover:scale-[1.03] hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
