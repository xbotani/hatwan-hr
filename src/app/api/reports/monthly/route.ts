import { NextRequest, NextResponse } from 'next/server'
import { reportQuerySchema } from '@/lib/validation'
import { aggregateMonthlySpending } from '@/lib/reports'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const sp = req.nextUrl.searchParams
    const parsed = reportQuerySchema.safeParse({
      companyId: sp.get('companyId'),
      year: sp.get('year'),
      month: sp.get('month') || undefined,
      departmentId: sp.get('departmentId') || undefined
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyId, year, month, departmentId } = parsed.data
    if (!month) {
      return NextResponse.json({ error: 'month is required' }, { status: 400 })
    }

    const departments = await aggregateMonthlySpending(
      companyId,
      year,
      month,
      departmentId
    )
    const totalCost = departments.reduce((sum, d) => sum + d.totalCost, 0)

    return NextResponse.json({
      year,
      month,
      totalCost,
      departments
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}