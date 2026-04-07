'use client'

import type { AppLocale } from './useAppLocale'

type LanguageToggleProps = {
  locale: AppLocale
  onChange: (locale: AppLocale) => void
}

export default function LanguageToggle({ locale, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-[var(--border)] bg-white/60 p-1 shadow-[var(--shadow-soft)] dark:bg-slate-950/70">
      {(['en', 'sq'] as const).map((item) => {
        const active = item === locale

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              active
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
