'use client'
import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/I18nProvider'
import { LocaleSwitcher } from '@/i18n/LocaleSwitcher'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    setLoading(false)

    if (result?.error) {
      setError(
        result.error === 'AccountDeactivated' ? t('login.deactivated') : t('login.error')
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card-lg">
        <div className="w-full flex justify-center mb-6">
          <Image
            src="/hatwan.jpg"
            alt={t('app.brand')}
            width={150}
            height={150}
            priority
            className="w-auto h-24 object-contain mx-auto"
          />
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('app.subtitle')}</p>
        </div>
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher className="[&>button]:!text-gray-700 [&>button]:!bg-gray-100 [&>button:hover]:!bg-gray-200" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? t('common.signingIn') : t('common.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
