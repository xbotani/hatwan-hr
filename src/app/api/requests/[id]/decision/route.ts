import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decisionSchema } from '@/lib/validation'
import { requireAdmin } from '@/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    const id = params.id
    const body = await req.json()
    const parsed = decisionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    const existing = await prisma.request.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been reviewed' },
        { status: 409 }
      )
    }

    const request = await prisma.request.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewDate: new Date(),
        reviewedBy: session.id
      }
    })

    return NextResponse.json(request)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
