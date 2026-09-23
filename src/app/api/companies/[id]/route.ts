import { NextResponse } from 'next/server'
import { companySchema } from '@/lib/validation'
import { updateCompany, deleteCompany, companyHasChildren } from '@/lib/orgs'
import { requireAdmin } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const body = await request.json()
    const parsed = companySchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const company = await updateCompany(params.id, parsed.data)
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    if (await companyHasChildren(params.id)) {
      return NextResponse.json(
        { error: 'Cannot remove a company that still has departments or users' },
        { status: 409 }
      )
    }
    await deleteCompany(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}