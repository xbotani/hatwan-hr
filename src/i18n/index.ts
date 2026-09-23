import { cookies } from 'next/headers'
import { Locale, normalizeLocale, dirFor } from './config'
import { Messages, createTranslator, Translator } from './translator'
import en from './messages/en.json'
import ckb from './messages/ckb.json'

export const dictionaries: Record<Locale, Messages> = { en, ckb }

export function getLocale(): Locale {
  return normalizeLocale(cookies().get('NEXT_LOCALE')?.value)
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale]
}

export interface ServerTranslations {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Translator
}

export function getServerTranslations(): ServerTranslations {
  const locale = getLocale()
  return {
    locale,
    dir: dirFor(locale),
    t: createTranslator(dictionaries[locale])
  }
}
