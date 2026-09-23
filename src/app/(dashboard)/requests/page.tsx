'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  StatusBadge,
  TableSkeleton,
  formatDate,
  formatMoney
} from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'

type RequestRow = {
  id: string
  itemName: string
  explanation: string
  necessityRating: number
  estimatedCost: number
  status: string
  requestDate: string
  reviewDate?: string | null
  department?: { id: string; name: string }
  requester?: { id: string; name: string; email: string }
  reviewer?: { id: string; name: string } | null
}

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'common.all' },
  { key: 'PENDING', labelKey: 'status.pending' },
  { key: 'APPROVED', labelKey: 'status.approved' },
  { key: 'REJECTED', labelKey: 'status.rejected' }
]

const PAGE_SIZE = 10

export default function RequestsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<RequestRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async (status: Filter) => {
    setLoading(true)
    setError(null)
    try {
      const q = status !== 'ALL' ? `?status=${status}` : ''
      const res = await fetch(`/api/requests${q}`)
      if (!res.ok) throw new Error(t('requests.failedToLoad'))
      setRequests(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : t('requests.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    setPage(1)
    load(filter)
  }, [filter, load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const decide = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/requests/${id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (!res.ok) throw new Error(t('requests.failedToUpdate'))
      await load(filter)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('requests.failedToUpdate'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/requests/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? t('requests.failedToDelete'))
      }
      setToast(t('requests.deleted'))
      setDeleteTarget(null)
      router.refresh()
      await load(filter)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('requests.failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const paged = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title={t('requests.title')}
        description={t('requests.description')}
        action={
          <Link
            href="/requests/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            + {t('common.newRequest')}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : requests.length === 0 ? (
          <EmptyState title={t('requests.noRequests')} description={t('requests.noRequestsDescription')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('requests.item')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.requester')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.department')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.rating')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.cost')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.status')}</th>
                  <th className="px-5 py-3 font-medium">{t('requests.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{r.itemName}</p>
                      <p className="max-w-xs truncate text-xs text-slate-500">{r.explanation}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{r.requester?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-700">{r.department?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge
                        color={r.necessityRating >= 7 ? 'red' : r.necessityRating >= 4 ? 'yellow' : 'green'}
                      >
                        {r.necessityRating}/10
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatMoney(r.estimatedCost)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                      {r.reviewDate && (
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(r.reviewDate)}
                          {r.reviewer ? ` by ${r.reviewer.name}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'PENDING' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              disabled={busyId === r.id}
                              onClick={() => decide(r.id, 'APPROVE')}
                            >
                              {t('requests.approve')}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busyId === r.id}
                              onClick={() => decide(r.id, 'REJECT')}
                            >
                              {t('requests.reject')}
                            </Button>
                          </>
                        )}
                        <Link
                          href={`/requests/${r.id}/print`}
                          target="_blank"
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {t('common.print')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          {t('requests.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && requests.length > 0 && (
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        )}
      </Card>

      {toast && (
        <div className="fixed bottom-4 start-4 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-card-lg">
          {toast}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
        >
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 4v6m4-6v6" />
              </svg>
            </div>
            <h2 id="delete-title" className="text-lg font-bold text-slate-900">
              {t('requests.deleteTitle')}
            </h2>
            <p id="delete-description" className="mt-2 text-sm text-slate-500">
              {t('requests.deleteDescription')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                {t('requests.confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}