'use client'

import { useState } from 'react'

export type AppLocale = 'sq' | 'en'

const STORAGE_KEY = 'app-locale'

const getInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'sq' || stored === 'en' ? stored : 'en'
}

export function useAppLocale() {
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale)

  const updateLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale)
    localStorage.setItem(STORAGE_KEY, nextLocale)
  }

  return { locale, setLocale: updateLocale }
}
