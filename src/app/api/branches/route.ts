import { NextResponse } from 'next/server'
import { branchSchema } from '@/lib/validation'
import { createBranch } from '@/lib/orgs'
import { requireAdmin } from '@/lib/session'

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const body = await request.json()
    const parsed = branchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const branch = await createBranch(parsed.data)
    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}