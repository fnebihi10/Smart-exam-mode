'use client'

import { useCallback, useEffect } from 'react'

export type AppLocale = 'en'

const STORAGE_KEY = 'app-locale'

export function useAppLocale() {
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, 'en')
  }, [])

  const updateLocale = useCallback((nextLocale: AppLocale) => {
    void nextLocale
    localStorage.setItem(STORAGE_KEY, 'en')
  }, [])

  return { locale: 'en' as AppLocale, setLocale: updateLocale }
}
