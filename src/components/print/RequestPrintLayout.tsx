'use client'

import type { ReactNode } from 'react'
import { createTranslator, type Messages } from '@/i18n/translator'
import ckb from '@/i18n/messages/ckb.json'
import { necessityLabelKey, necessityBadgeColor } from '@/lib/necessity'
import {
  formatKurdishDate,
  formatKurdishNumber,
  formatKurdishRating
} from '@/lib/kurdish'

// The print document is always rendered in Central Kurdish (Sorani), regardless
// of the active UI locale, so it pulls labels directly from the ckb dictionary.
const t = createTranslator(ckb as Messages)

interface RequestPrintLayoutProps {
  companyName: string
  departmentName: string
  requesterName: string
  requesterRole?: string
  itemName: string
  explanation: string
  rating: number
  estimatedCost?: number | null
  ceoName?: string
  approvalStatus?: 'APPROVED' | 'REJECTED'
  reviewDate?: string
  requestDate?: string
  requestRef?: string
}

function roleLabel(role?: string): string {
  if (!role) return t('print.notProvided')
  const key = `roles.${role}`
  const label = t(key)
  return label === key ? role : label
}

const BADGE_CLASSES: Record<ReturnType<typeof necessityBadgeColor>, string> = {
  red: 'bg-red-50 text-red-800 ring-red-200',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200'
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="h-4 w-1 rounded-full bg-brand-600" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex">
      <div className="w-40 shrink-0 rounded-r-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        {label}
      </div>
      <div className="flex-1 px-4 py-3 text-sm font-medium text-slate-900">{value || '—'}</div>
    </div>
  )
}

function SignatureCell({ title, name }: { title: string; name?: string }) {
  return (
    <div className="text-center">
      <div className="mb-2 h-24 border-b border-slate-400" aria-hidden="true" />
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {name && <div className="mt-1 text-xs text-slate-600">{name}</div>}
      <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] text-slate-500">
        <div>
          <div className="font-semibold text-slate-600">{t('print.signatureDate')}</div>
          <div className="mt-1.5 h-6 border-b border-dashed border-slate-300" aria-hidden="true" />
        </div>
        <div>
          <div className="font-semibold text-slate-600">{t('print.officialStamp')}</div>
          <div className="mt-1.5 flex h-6 items-center justify-center rounded border border-dashed border-slate-300 text-slate-400">
            ◈
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RequestPrintLayout({
  companyName,
  departmentName,
  requesterName,
  requesterRole,
  itemName,
  explanation,
  rating,
  estimatedCost,
  ceoName = 'Mohammed Ahmed Ali',
  approvalStatus,
  reviewDate,
  requestDate,
  requestRef
}: RequestPrintLayoutProps) {
  const badgeClass = BADGE_CLASSES[necessityBadgeColor(rating)]

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:min-h-0 print:bg-white print:py-0">
      <div dir="rtl" className="mx-auto mb-4 flex max-w-[210mm] justify-end gap-2 px-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          {t('common.print')}
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('print.close')}
        </button>
      </div>

      <div
        id="print-section"
        dir="rtl"
        lang="ckb"
        style={{ fontFamily: 'var(--font-noto-sans-arabic), "Segoe UI", Tahoma, sans-serif' }}
        className="mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white p-[20mm] text-slate-900 shadow-lg print:w-auto print:min-h-[257mm] print:p-0 print:shadow-none"
      >
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hatwan.jpg"
              alt="Hatwan Logo"
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              className="rounded-md"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
              <p className="mt-1 text-sm text-slate-500">{t('print.procurementSystem')}</p>
            </div>
          </div>

          <div className="min-w-[200px] text-xs leading-6 text-slate-600">
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-800">{t('print.requestId')}</span>
              <span className="font-medium text-slate-900">{requestRef ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-800">{t('print.submissionDate')}</span>
              <span className="font-medium text-slate-900">{formatKurdishDate(requestDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-semibold text-slate-800">{t('print.documentTypeLabel')}</span>
              <span className="font-medium text-slate-900">{t('print.documentType')}</span>
            </div>
          </div>
        </header>

        <div className="mt-4 h-px bg-slate-300" />

        <div className="mt-5 text-center">
          <h2 className="text-lg font-bold text-slate-900">{t('print.documentTitle')}</h2>
        </div>

        <Section title={t('print.requesterInformation')}>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <DataRow label={t('print.name')} value={requesterName} />
            <DataRow label={t('print.role')} value={roleLabel(requesterRole)} />
            <DataRow label={t('print.department')} value={departmentName} />
            <DataRow label={t('print.company')} value={companyName} />
          </div>
        </Section>

        <Section title={t('print.requestDetails')}>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <DataRow label={t('print.whatTheyWant')} value={itemName} />
            <div className="flex">
              <div className="w-40 shrink-0 rounded-r-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                {t('print.whyTheyWant')}
              </div>
              <div className="flex-1 whitespace-pre-line px-4 py-3 text-sm leading-6 text-slate-900">
                {explanation || '—'}
              </div>
            </div>
          </div>
        </Section>

        <Section title={t('print.necessity')}>
          <div className="rounded-xl ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${badgeClass}`}
              >
                {t(necessityLabelKey(rating))}
              </span>
              <span className="text-sm font-semibold text-slate-700">{formatKurdishRating(rating)}</span>
            </div>
            <div
              data-testid="rating-meter"
              className="flex gap-1 px-4 pb-4"
              role="img"
              aria-label={`${rating} / 10`}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < rating ? 'bg-slate-800' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {estimatedCost != null && estimatedCost > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-200">
              <DataRow label={t('print.estimatedCost')} value={formatKurdishNumber(estimatedCost)} />
            </div>
          )}

          {approvalStatus && (
            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-200">
              <div className="flex">
                <div className="w-40 shrink-0 rounded-r-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  {t('print.status')}
                </div>
                <div className="flex-1 px-4 py-3 text-sm font-semibold">
                  <span className={approvalStatus === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}>
                    {approvalStatus === 'APPROVED' ? t('print.approved') : t('print.rejected')}
                  </span>
                  {reviewDate && (
                    <span className="ms-3 font-normal text-slate-500">
                      {t('print.reviewDate')}: {formatKurdishDate(reviewDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>
        <div className="mt-auto pt-10 print-no-break">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-300" />
            <h2 className="text-sm font-bold text-slate-800">{t('print.officialApproval')}</h2>
            <span className="h-px flex-1 bg-slate-300" />
          </div>

          <div className="flex justify-end">
            <div className="w-72">
              <SignatureCell title={t('print.ceoSignature')} name={ceoName} />
            </div>
          </div>

          <footer className="mt-10 border-t border-slate-200 pt-4 text-center">
            <div className="text-xs font-medium text-slate-700">
              {t('print.generatedBy')} • {t('print.confidential')}
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}