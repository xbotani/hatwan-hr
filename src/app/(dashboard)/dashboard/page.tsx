import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerTranslations } from '@/i18n'
import { isAdminRole } from '@/lib/roles'
import { necessityBadgeColor } from '@/lib/necessity'
import { Badge, Card, CardContent, EmptyState, PageHeader, StatusBadge, formatDate, formatMoney } from '@/components/ui'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, 'green' | 'red' | 'yellow'> = {
  APPROVED: 'green',
  REJECTED: 'red',
  PENDING: 'yellow'
}

export default async function DashboardPage() {
  const { t, dir } = getServerTranslations()
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? 'EMPLOYEE'

  if (!isAdminRole(role)) {
    const myRequests = await prisma.request.findMany({
      where: { requesterId: session?.user?.id ?? '' },
      orderBy: { requestDate: 'desc' }
    })

    return (
      <div>
        <PageHeader
          title={t('history.title')}
          description={t('history.description')}
          action={
            <Link
              href="/requests/new"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              + {t('nav.newRequest')}
            </Link>
          }
        />

        <Card>
          {myRequests.length === 0 ? (
            <EmptyState title={t('history.empty')} description={t('history.emptyDescription')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t('history.what')}</th>
                    <th className="px-5 py-3 font-medium">{t('history.why')}</th>
                    <th className="px-5 py-3 font-medium">{t('history.necessity')}</th>
                    <th className="px-5 py-3 font-medium">{t('history.date')}</th>
                    <th className="px-5 py-3 font-medium">{t('history.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{r.itemName}</td>
                      <td className="max-w-xs px-5 py-3 text-slate-600">
                        <p className="truncate">{r.explanation}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={necessityBadgeColor(r.necessityRating)}>
                          {r.necessityRating}/10
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{formatDate(r.requestDate)}</td>
                      <td className="px-5 py-3">
                        <Badge color={STATUS_COLORS[r.status] ?? 'gray'}>
                          {t(`status.${r.status.toLowerCase()}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    )
  }

  const [requests, companyCount, departmentCount] = await Promise.all([
    prisma.request.findMany({
      include: {
        department: { select: { name: true } },
        requester: { select: { name: true } }
      },
      orderBy: { requestDate: 'desc' }
    }),
    prisma.company.count(),
    prisma.department.count()
  ])

  const pending = requests.filter((r) => r.status === 'PENDING')
  const approved = requests.filter((r) => r.status === 'APPROVED')
  const rejected = requests.filter((r) => r.status === 'REJECTED')
  const totalSpend = approved.reduce((sum, r) => sum + r.estimatedCost, 0)

  const stats = [
    { label: t('dashboard.totalRequests'), value: requests.length, tone: 'text-slate-900' },
    { label: t('dashboard.pending'), value: pending.length, tone: 'text-amber-600' },
    { label: t('dashboard.approved'), value: approved.length, tone: 'text-emerald-600' },
    { label: t('dashboard.rejected'), value: rejected.length, tone: 'text-red-600' },
    { label: t('dashboard.companies'), value: companyCount, tone: 'text-slate-900' },
    { label: t('dashboard.departments'), value: departmentCount, tone: 'text-slate-900' }
  ]

  const viewAllArrow = dir === 'rtl' ? '←' : '→'

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        action={
          <div className="flex gap-2">
            <Link
              href="/requests/new"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              + {t('common.newRequest')}
            </Link>
            <Link
              href="/reports"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {t('common.viewReports')}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {s.label}
              </p>
              <p className={`mt-2 text-3xl font-bold ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t('dashboard.approvedSpend')}</h2>
            <p className="text-sm text-slate-500">{t('dashboard.approvedSpendDescription')}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatMoney(totalSpend)}</p>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t('dashboard.recentPending')}</h2>
          <Link href="/requests" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            {t('common.viewAll')} {viewAllArrow}
          </Link>
        </div>
        {pending.length === 0 ? (
          <EmptyState title={t('dashboard.noPending')} description={t('dashboard.noPendingDescription')} />
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{r.itemName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.requester?.name} · {r.department?.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge color="blue">{r.necessityRating}/10</Badge>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}