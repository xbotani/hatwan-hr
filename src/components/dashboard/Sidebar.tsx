'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useI18n } from '@/i18n/I18nProvider'
import { LocaleSwitcher } from '@/i18n/LocaleSwitcher'
import { isAdminRole } from '@/lib/roles'

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    </svg>
  ),
  building: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l6-4 6 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01M10 21v-4h4v4" />
    </svg>
  ),
  clipboard: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1 5h10M7 15h6" />
    </svg>
  ),
  chart: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7m6 7H2" />
    </svg>
  ),
  plus: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

const ADMIN_NAV = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { href: '/admin/organization', labelKey: 'nav.organization', icon: 'building' },
  { href: '/requests', labelKey: 'nav.requests', icon: 'clipboard' },
  { href: '/reports', labelKey: 'nav.reports', icon: 'chart' }
]

const EMPLOYEE_NAV = [
  { href: '/dashboard', labelKey: 'nav.myDashboard', icon: 'dashboard' },
  { href: '/requests/new', labelKey: 'nav.newRequest', icon: 'plus' }
]

export function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const isAdmin = isAdminRole(user.role)
  const NAV = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <Image
              src="/hatwan.jpg"
              alt={t('app.brand')}
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight text-white">
              {t('app.brand')}
            </div>
            <div className="truncate text-[11px] text-slate-400">{t('app.subtitle')}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {ICONS[item.icon]}
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className="truncate text-[11px] uppercase tracking-wide text-slate-400">
                {user.role}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <LocaleSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              {t('common.signOut')}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/hatwan.jpg"
                alt={t('app.brand')}
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-bold text-slate-900">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher className="[&>button]:!text-slate-700 [&>button]:hover:!bg-slate-100" />
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-slate-500">
              {t('common.signOut')}
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
      </header>
    </>
  )
}
