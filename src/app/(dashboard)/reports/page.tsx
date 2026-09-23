'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Spinner,
  formatMoney
} from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

type Company = { id: string; name: string }
type Department = { id: string; companyId: string; name: string }
type DepartmentSpend = {
  departmentId: string
  departmentName: string
  requestCount: number
  totalCost: number
}
type MonthlyPoint = { month: number; totalCost: number; requestCount: number }
type Overview = {
  period: { year: number; month?: number }
  totalSpend: number
  totalRequests: number
  approvalRate: number
  previousSpend: number
  previousRequests: number
  previousApprovalRate: number
  monthlyTrend: MonthlyPoint[]
  byDepartment: DepartmentSpend[]
}

const PIE_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
  '#84cc16',
  '#6366f1'
]

function compactMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M د.ع`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k د.ع`
  return `${Math.round(n)} د.ع`
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-card">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-brand-600">
        {formatMoney(Number(payload[0]?.value ?? 0))}
      </p>
    </div>
  )
}

function Trend({
  current,
  previous,
  mode
}: {
  current: number
  previous: number
  mode: 'amount' | 'points'
}) {
  if (mode === 'points') {
    const diff = current - previous
    if (diff === 0) return <span className="text-xs font-medium text-slate-400">0</span>
    const good = diff > 0
    return (
      <span className={`text-xs font-semibold ${good ? 'text-emerald-600' : 'text-red-600'}`}>
        {good ? '+' : '−'}
        {Math.abs(diff).toFixed(0)} pp
      </span>
    )
  }

  if (previous === 0) {
    return current > 0 ? (
      <span className="text-xs font-semibold text-emerald-600">+100%</span>
    ) : (
      <span className="text-xs font-medium text-slate-400">0%</span>
    )
  }

  const pct = ((current - previous) / previous) * 100
  const good = pct >= 0
  return (
    <span className={`text-xs font-semibold ${good ? 'text-emerald-600' : 'text-red-600'}`}>
      {good ? '+' : '−'}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}


export default function ReportsPage() {
  const { t, dir } = useI18n()
  const [companies, setCompanies] = useState<Company[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [companyId, setCompanyId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 8 }, (_, i) => current - 3 + i)
  }, [])

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => setError(t('reports.failedLoadCompanies')))
  }, [t])

  useEffect(() => {
    if (!companyId) {
      setDepartments([])
      return
    }
    fetch(`/api/departments?companyId=${companyId}`)
      .then((r) => r.json())
      .then((data: Department[]) => setDepartments(data))
      .catch(() => setError(t('reports.failedLoadDepartments')))
  }, [companyId, t])

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ companyId, year: String(year) })
    if (departmentId) params.set('departmentId', departmentId)
    if (period === 'monthly') params.set('month', String(month))

    fetch(`/api/reports/overview?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(t('reports.failedGenerate'))
        return r.json()
      })
      .then((data: Overview) => {
        if (!cancelled) setOverview(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('reports.failedGenerate'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [companyId, departmentId, period, year, month, t])

  const trendData = useMemo(() => {
    if (!overview) return []
    const data = overview.monthlyTrend.map((p) => ({
      ...p,
      label: t(`months.${p.month}`)
    }))
    return dir === 'rtl' ? [...data].reverse() : data
  }, [overview, dir, t])

  const pieData = useMemo(
    () =>
      (overview?.byDepartment ?? []).map((d) => ({
        name: d.departmentName,
        value: d.totalCost
      })),
    [overview]
  )

  const maxDepartmentCost = useMemo(
    () => Math.max(1, ...(overview?.byDepartment ?? []).map((d) => d.totalCost)),
    [overview]
  )

  const periodTitle = overview
    ? period === 'monthly'
      ? `${t(`months.${overview.period.month ?? month}`)} ${overview.period.year}`
      : String(overview.period.year)
    : ''

  const exportCsv = () => {
    if (!overview) return
    const rows: (string | number)[][] = [
      [t('reports.totalSpend'), overview.totalSpend],
      [t('reports.totalRequests'), overview.totalRequests],
      [t('reports.approvalRate'), `${overview.approvalRate}%`],
      [],
      [t('reports.departmentCol'), t('reports.requestsCol'), t('reports.costCol')],
      ...overview.byDepartment.map((d) => [d.departmentName, d.requestCount, d.totalCost])
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const filename =
      period === 'monthly'
        ? `hatwan-report-${year}-${String(month).padStart(2, '0')}.csv`
        : `hatwan-report-${year}.csv`
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title={t('reports.title')} description={t('reports.description')} />

      <Card className="mb-6">
        <CardHeader
          title={t('reports.filters')}
          action={
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!overview}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              {t('reports.exportReport')}
            </Button>
          }
        />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label={t('reports.company')}>
              <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">{t('common.selectCompany')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('reports.department')}>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!companyId}
              >
                <option value="">{t('common.allDepartments')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('reports.period')}>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'monthly' | 'yearly')}
              >
                <option value="monthly">{t('reports.monthly')}</option>
                <option value="yearly">{t('reports.yearly')}</option>
              </Select>
            </Field>
            <Field label={t('reports.year')}>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
            {period === 'monthly' && (
              <Field label={t('reports.month')}>
                <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {t(`months.${m}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {!companyId ? (
        <EmptyState title={t('reports.selectCompanyPrompt')} description={t('reports.selectCompanyDescription')} />
      ) : loading && !overview ? (
        <Spinner />
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('reports.totalSpend')}
                  </p>
                  <Trend current={overview.totalSpend} previous={overview.previousSpend} mode="amount" />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatMoney(overview.totalSpend)}
                </p>
                <p className="mt-1 text-xs text-slate-400">{t('reports.vsPrevious')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('reports.totalRequests')}
                  </p>
                  <Trend current={overview.totalRequests} previous={overview.previousRequests} mode="amount" />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">{overview.totalRequests}</p>
                <p className="mt-1 text-xs text-slate-400">{t('reports.vsPrevious')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('reports.approvalRate')}
                  </p>
                  <Trend
                    current={overview.approvalRate}
                    previous={overview.previousApprovalRate}
                    mode="points"
                  />
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">{overview.approvalRate}%</p>
                <p className="mt-1 text-xs text-slate-400">{t('reports.ofAllRequests')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={t('reports.spendTrend')} subtitle={periodTitle} />
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={compactMoney}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: '#eef2ff' }} />
                    <Bar dataKey="totalCost" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={t('reports.spendByDepartment')} subtitle={periodTitle} />
              <CardContent>
                {pieData.length === 0 ? (
                  <EmptyState title={t('reports.noApproved')} description={t('reports.noSpending')} />
                ) : (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={80}
                            paddingAngle={2}
                            strokeWidth={2}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(overview?.byDepartment ?? []).map((d, i) => (
                        <div key={d.departmentId}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium text-slate-700">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                              />
                              {d.departmentName}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatMoney(d.totalCost)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-600"
                              style={{ width: `${(d.totalCost / maxDepartmentCost) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}