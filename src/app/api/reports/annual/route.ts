import { NextRequest, NextResponse } from 'next/server'
import { reportQuerySchema } from '@/lib/validation'
import { aggregateAnnualSpending } from '@/lib/reports'
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
      departmentId: sp.get('departmentId') || undefined
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyId, year, departmentId } = parsed.data
    const departments = await aggregateAnnualSpending(companyId, year, departmentId)
    const totalCost = departments.reduce((sum, d) => sum + d.totalCost, 0)

    return NextResponse.json({
      year,
      totalCost,
      totalDepartmentReports: departments.length,
      departments
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
