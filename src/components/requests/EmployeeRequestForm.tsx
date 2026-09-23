'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  PageHeader,
  Textarea
} from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'
import { necessityLabelKey } from '@/lib/necessity'

/**
 * The "Zen" request form for non-admin users: exactly three inputs.
 * No company/branch/department dropdowns and no budget/cost field — the
 * server derives the tenant context from the authenticated user.
 */
export function EmployeeRequestForm() {
  const router = useRouter()
  const { t } = useI18n()
  const [itemName, setItemName] = useState('')
  const [explanation, setExplanation] = useState('')
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          explanation,
          necessityRating: rating
        })
      })
      if (!res.ok) throw new Error(t('zen.failed'))
      setSuccess(true)
      setItemName('')
      setExplanation('')
      setRating(5)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('zen.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('zen.title')} description={t('zen.description')} />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t('zen.success')}
              </div>
            )}

            <Field label={t('zen.what')}>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t('zen.whatPlaceholder')}
                required
              />
            </Field>

            <Field label={t('zen.why')}>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={t('zen.whyPlaceholder')}
                rows={5}
                required
              />
            </Field>

            <Field
              label={t('zen.necessity')}
              hint={`${rating} / 10 — ${t(necessityLabelKey(rating))}`}
            >
              <div className="grid grid-cols-10 gap-1.5" dir="ltr" role="radiogroup" aria-label={t('zen.necessity')}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const selected = n === rating
                  const filled = n <= rating
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${n} / 10`}
                      onClick={() => setRating(n)}
                      className={`h-10 rounded-lg text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:scale-95 ${
                        filled
                          ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      } ${selected ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </Field>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? t('zen.submitting') : t('zen.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
