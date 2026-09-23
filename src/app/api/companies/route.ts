import { NextResponse } from 'next/server'
import { companySchema } from '@/lib/validation'
import { listCompanies, createCompany } from '@/lib/orgs'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try {
    const companies = await listCompanies()
    return NextResponse.json(companies)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const body = await request.json()
    const parsed = companySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const company = await createCompany(parsed.data)
    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
