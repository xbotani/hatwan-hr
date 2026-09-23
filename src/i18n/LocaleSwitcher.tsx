'use client'

import { useI18n } from './I18nProvider'
import { locales, localeNames } from './config'

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} role="group" aria-label="Language">
      {locales.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'bg-brand-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {localeNames[l]}
          </button>
        )
      })}
    </div>
  )
}
