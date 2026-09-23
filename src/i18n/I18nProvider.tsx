'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Locale, dirFor, LOCALE_COOKIE } from './config'
import { Messages, createTranslator, Translator } from './translator'

export interface I18nContextValue {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Translator
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}) {
  const router = useRouter()

  const t = useMemo(() => createTranslator(messages), [messages])

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = next
      document.documentElement.dir = dirFor(next)
      router.refresh()
    },
    [router]
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir: dirFor(locale), t, setLocale }),
    [locale, t, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}
