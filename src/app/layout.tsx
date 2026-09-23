import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/i18n/I18nProvider'
import { normalizeLocale, dirFor } from '@/i18n/config'
import { dictionaries } from '@/i18n'

// Self-hosted Arabic-script font that shapes Central Kurdish (Sorani) correctly.
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: 'variable',
  variable: '--font-noto-sans-arabic',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Hatwan Procurement System',
  description: 'Multi-tenant procurement request management'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const locale = normalizeLocale(cookies().get('NEXT_LOCALE')?.value)
  const dir = dirFor(locale)
  const messages = dictionaries[locale]

  return (
    <html lang={locale} dir={dir} className={notoSansArabic.variable}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
