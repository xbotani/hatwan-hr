import { prisma } from '@/lib/prisma'

export interface DepartmentSpend {
  departmentId: string
  departmentName: string
  requestCount: number
  totalCost: number
}

interface GroupedSpend {
  departmentId: string
  _count: { id: number }
  _sum: { estimatedCost: number | null }
}

async function hydrateNames(grouped: GroupedSpend[]): Promise<DepartmentSpend[]> {
  const deptIds = grouped.map((r) => r.departmentId)
  const departments = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true }
  })
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  return grouped.map((r) => ({
    departmentId: r.departmentId,
    departmentName: deptMap.get(r.departmentId) || 'Unknown',
    requestCount: r._count.id,
    totalCost: r._sum.estimatedCost ?? 0
  }))
}

/**
 * Aggregates approved-request spend for a single calendar month,
 * grouped by department and optionally filtered by department.
 */
export async function aggregateMonthlySpending(
  companyId: string,
  year: number,
  month: number,
  departmentId?: string
): Promise<DepartmentSpend[]> {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  const grouped = await prisma.request.groupBy({
    by: ['departmentId'],
    where: {
      companyId,
      status: 'APPROVED',
      reviewDate: { gte: start, lt: end },
      ...(departmentId ? { departmentId } : {})
    },
    _count: { id: true },
    _sum: { estimatedCost: true }
  })

  return hydrateNames(grouped)
}

/**
 * Aggregates approved-request spend for a whole year,
 * grouped by department and optionally filtered by department.
 */
export async function aggregateAnnualSpending(
  companyId: string,
  year: number,
  departmentId?: string
): Promise<DepartmentSpend[]> {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))

  const grouped = await prisma.request.groupBy({
    by: ['departmentId'],
    where: {
      companyId,
      status: 'APPROVED',
      reviewDate: { gte: start, lt: end },
      ...(departmentId ? { departmentId } : {})
    },
    _count: { id: true },
    _sum: { estimatedCost: true }
  })

  return hydrateNames(grouped)
}

export interface MonthlyPoint {
  month: number // 1-12
  totalCost: number
  requestCount: number
}

export interface ExecutiveOverview {
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

interface PeriodStats {
  totalSpend: number
  totalRequests: number
  approvalRate: number
}

async function computePeriodStats(
  companyId: string,
  start: Date,
  end: Date,
  departmentId?: string
): Promise<PeriodStats> {
  const rows = await prisma.request.findMany({
    where: {
      companyId,
      requestDate: { gte: start, lt: end },
      ...(departmentId ? { departmentId } : {})
    },
    select: { status: true, estimatedCost: true }
  })

  const totalRequests = rows.length
  const approved = rows.filter((r) => r.status === 'APPROVED')
  const totalSpend = approved.reduce((sum, r) => sum + r.estimatedCost, 0)
  const approvalRate =
    totalRequests === 0 ? 0 : Math.round((approved.length / totalRequests) * 100)

  return { totalSpend, totalRequests, approvalRate }
}

/**
 * Approved spend by calendar month for a whole year. Always returns 12 buckets
 * (zero-filled) so the executive trend chart is stable across periods.
 */
export async function aggregateMonthlyTrend(
  companyId: string,
  year: number,
  departmentId?: string
): Promise<MonthlyPoint[]> {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))

  const rows = await prisma.request.findMany({
    where: {
      companyId,
      status: 'APPROVED',
      requestDate: { gte: start, lt: end },
      ...(departmentId ? { departmentId } : {})
    },
    select: { requestDate: true, estimatedCost: true }
  })

  const buckets: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalCost: 0,
    requestCount: 0
  }))

  for (const row of rows) {
    const m = row.requestDate.getUTCMonth()
    buckets[m].totalCost += row.estimatedCost
    buckets[m].requestCount += 1
  }

  return buckets
}

export async function aggregateDepartmentSpend(
  companyId: string,
  start: Date,
  end: Date,
  departmentId?: string
): Promise<DepartmentSpend[]> {
  const grouped = await prisma.request.groupBy({
    by: ['departmentId'],
    where: {
      companyId,
      status: 'APPROVED',
      requestDate: { gte: start, lt: end },
      ...(departmentId ? { departmentId } : {})
    },
    _count: { id: true },
    _sum: { estimatedCost: true }
  })

  return hydrateNames(grouped)
}

/**
 * Single-shot executive summary: KPI values for the selected period plus the
 * previous period (for trend deltas), a 12-month spend trend and a department
 * breakdown. Submitted-date based so the numbers read intuitively to executives.
 */
export async function getExecutiveOverview(
  companyId: string,
  year: number,
  month?: number,
  departmentId?: string
): Promise<ExecutiveOverview> {
  const currentStart = month
    ? new Date(Date.UTC(year, month - 1, 1))
    : new Date(Date.UTC(year, 0, 1))
  const currentEnd = month
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year + 1, 0, 1))

  let previousStart: Date
  let previousEnd: Date
  if (month) {
    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    previousStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1))
    previousEnd = new Date(Date.UTC(prevYear, prevMonth, 1))
  } else {
    previousStart = new Date(Date.UTC(year - 1, 0, 1))
    previousEnd = new Date(Date.UTC(year, 0, 1))
  }

  const [current, previous, monthlyTrend, byDepartment] = await Promise.all([
    computePeriodStats(companyId, currentStart, currentEnd, departmentId),
    computePeriodStats(companyId, previousStart, previousEnd, departmentId),
    aggregateMonthlyTrend(companyId, year, departmentId),
    aggregateDepartmentSpend(companyId, currentStart, currentEnd, departmentId)
  ])

  return {
    period: { year, month },
    totalSpend: current.totalSpend,
    totalRequests: current.totalRequests,
    approvalRate: current.approvalRate,
    previousSpend: previous.totalSpend,
    previousRequests: previous.totalRequests,
    previousApprovalRate: previous.approvalRate,
    monthlyTrend,
    byDepartment
  }
}

