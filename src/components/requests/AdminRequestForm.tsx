'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea
} from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'

type Company = { id: string; name: string }
type Department = { id: string; companyId: string; name: string }

export function AdminRequestForm() {
  const router = useRouter()
  const { t } = useI18n()
  const [companies, setCompanies] = useState<Company[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [companyId, setCompanyId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [itemName, setItemName] = useState('')
  const [explanation, setExplanation] = useState('')
  const [rating, setRating] = useState(5)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => setError(t('newRequest.failedLoadCompanies')))
  }, [t])

  useEffect(() => {
    if (!companyId) {
      setDepartments([])
      return
    }
    fetch(`/api/departments?companyId=${companyId}`)
      .then((r) => r.json())
      .then((data: Department[]) => setDepartments(data))
      .catch(() => setError(t('newRequest.failedLoadDepartments')))
  }, [companyId, t])

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
          companyId,
          departmentId,
          itemName,
          explanation,
          necessityRating: Number(rating),
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined
        })
      })
      if (!res.ok) throw new Error(t('newRequest.failed'))
      setSuccess(true)
      setItemName('')
      setExplanation('')
      setRating(5)
      setEstimatedCost('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newRequest.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const ratingColor = rating >= 7 ? 'text-red-600' : rating >= 4 ? 'text-amber-600' : 'text-green-600'

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('newRequest.title')} description={t('newRequest.description')} />

      <Card>
        <CardHeader title={t('newRequest.details')} subtitle={t('newRequest.requiredHint')} />
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {t('newRequest.success')}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('newRequest.company')}>
                <Select
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value)
                    setDepartmentId('')
                  }}
                  required
                >
                  <option value="">{t('common.selectCompany')}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('newRequest.department')}>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  disabled={!companyId}
                >
                  <option value="">{t('common.selectDepartment')}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label={t('newRequest.item')}>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t('newRequest.itemPlaceholder')}
                required
              />
            </Field>

            <Field label={t('newRequest.explanation')}>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={t('newRequest.explanationPlaceholder')}
                rows={4}
                required
              />
            </Field>

            <Field label={t('newRequest.rating')}>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <span className={`w-16 text-center text-2xl font-bold ${ratingColor}`}>{rating}</span>
              </div>
            </Field>

            <Field label={t('newRequest.cost')} hint={t('newRequest.costHint')}>
              <Input
                type="number"
                min={0}
                step="1"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="د.ع"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('newRequest.submitting') : t('newRequest.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}