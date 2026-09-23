export const locales = ['ckb', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ckb'

export const localeNames: Record<Locale, string> = {
  ckb: 'کوردی',
  en: 'English'
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ckb'
}

export function dirFor(locale: Locale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return value && isLocale(value) ? value : defaultLocale
}

export const LOCALE_COOKIE = 'NEXT_LOCALE'
