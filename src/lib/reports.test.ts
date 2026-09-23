import { prisma } from '@/lib/prisma'
import {
  aggregateMonthlySpending,
  aggregateAnnualSpending,
  aggregateMonthlyTrend,
  getExecutiveOverview
} from '@/lib/reports'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    request: {
      groupBy: jest.fn(),
      findMany: jest.fn()
    },
    department: {
      findMany: jest.fn()
    }
  }
}))

const mockRequestGroupBy = prisma.request.groupBy as jest.Mock
const mockRequestFindMany = prisma.request.findMany as jest.Mock
const mockDepartmentFindMany = prisma.department.findMany as jest.Mock

describe('report aggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('aggregates monthly spending by department with cost sums', async () => {
    mockRequestGroupBy.mockResolvedValue([
      { departmentId: 'dept-1', _count: { id: 5 }, _sum: { estimatedCost: 1500 } },
      { departmentId: 'dept-2', _count: { id: 3 }, _sum: { estimatedCost: 750 } }
    ])
    mockDepartmentFindMany.mockResolvedValue([
      { id: 'dept-1', name: 'IT Department' },
      { id: 'dept-2', name: 'Operations' }
    ])

    const result = await aggregateMonthlySpending('company-1', 2024, 3)

    expect(mockRequestGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['departmentId'],
        where: expect.objectContaining({ companyId: 'company-1', status: 'APPROVED' }),
        _count: { id: true },
        _sum: { estimatedCost: true }
      })
    )

    expect(result).toEqual([
      { departmentId: 'dept-1', departmentName: 'IT Department', requestCount: 5, totalCost: 1500 },
      { departmentId: 'dept-2', departmentName: 'Operations', requestCount: 3, totalCost: 750 }
    ])
  })

  it('computes inclusive month bounds for monthly aggregation', async () => {
    mockRequestGroupBy.mockResolvedValue([])
    mockDepartmentFindMany.mockResolvedValue([])

    await aggregateMonthlySpending('company-1', 2024, 2)

    const where = mockRequestGroupBy.mock.calls[0][0].where
    expect(where.reviewDate.gte).toEqual(new Date('2024-02-01T00:00:00.000Z'))
    expect(where.reviewDate.lt).toEqual(new Date('2024-03-01T00:00:00.000Z'))
  })

  it('aggregates annual spending by department', async () => {
    mockRequestGroupBy.mockResolvedValue([
      { departmentId: 'dept-1', _count: { id: 9 }, _sum: { estimatedCost: 2000 } }
    ])
    mockDepartmentFindMany.mockResolvedValue([{ id: 'dept-1', name: 'IT Department' }])

    const result = await aggregateAnnualSpending('company-1', 2024)

    expect(result).toEqual([
      { departmentId: 'dept-1', departmentName: 'IT Department', requestCount: 9, totalCost: 2000 }
    ])
    const where = mockRequestGroupBy.mock.calls[0][0].where
    expect(where.reviewDate.gte).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    expect(where.reviewDate.lt).toEqual(new Date('2025-01-01T00:00:00.000Z'))
  })

  it('filters by department when supplied', async () => {
    mockRequestGroupBy.mockResolvedValue([])
    mockDepartmentFindMany.mockResolvedValue([])

    await aggregateAnnualSpending('company-1', 2024, 'dept-3')
    expect(mockRequestGroupBy.mock.calls[0][0].where.departmentId).toBe('dept-3')
  })

  it('treats null sums as zero and unknown departments as Unknown', async () => {
    mockRequestGroupBy.mockResolvedValue([
      { departmentId: 'dept-x', _count: { id: 2 }, _sum: { estimatedCost: null } }
    ])
    mockDepartmentFindMany.mockResolvedValue([])

    const result = await aggregateAnnualSpending('company-1', 2024)
    expect(result[0].departmentName).toBe('Unknown')
    expect(result[0].totalCost).toBe(0)
  })

  it('returns an empty array when no requests', async () => {
    mockRequestGroupBy.mockResolvedValue([])
    mockDepartmentFindMany.mockResolvedValue([])

    const result = await aggregateAnnualSpending('company-1', 2024)
    expect(result).toEqual([])
  })

  it('buckets approved spend by month across a whole year', async () => {
    mockRequestFindMany.mockResolvedValue([
      { requestDate: new Date('2024-01-15T00:00:00.000Z'), estimatedCost: 100 },
      { requestDate: new Date('2024-01-20T00:00:00.000Z'), estimatedCost: 50 },
      { requestDate: new Date('2024-03-05T00:00:00.000Z'), estimatedCost: 300 }
    ])

    const trend = await aggregateMonthlyTrend('company-1', 2024)
    expect(trend).toHaveLength(12)
    expect(trend[0]).toEqual({ month: 1, totalCost: 150, requestCount: 2 })
    expect(trend[2]).toEqual({ month: 3, totalCost: 300, requestCount: 1 })
    expect(trend[11].totalCost).toBe(0)
  })

  it('builds an executive overview with KPIs, trend and department breakdown', async () => {
    mockRequestFindMany.mockResolvedValue([
      { status: 'APPROVED', estimatedCost: 100, requestDate: new Date('2024-01-15T00:00:00.000Z') },
      { status: 'PENDING', estimatedCost: 50, requestDate: new Date('2024-01-20T00:00:00.000Z') },
      { status: 'APPROVED', estimatedCost: 300, requestDate: new Date('2024-03-05T00:00:00.000Z') }
    ])
    mockRequestGroupBy.mockResolvedValue([
      { departmentId: 'dept-1', _count: { id: 2 }, _sum: { estimatedCost: 400 } }
    ])
    mockDepartmentFindMany.mockResolvedValue([{ id: 'dept-1', name: 'IT Department' }])

    const overview = await getExecutiveOverview('company-1', 2024)

    expect(overview.totalRequests).toBe(3)
    expect(overview.totalSpend).toBe(400)
    expect(overview.approvalRate).toBe(67)
    expect(overview.monthlyTrend).toHaveLength(12)
    expect(overview.byDepartment[0]).toEqual({
      departmentId: 'dept-1',
      departmentName: 'IT Department',
      requestCount: 2,
      totalCost: 400
    })
  })
})
