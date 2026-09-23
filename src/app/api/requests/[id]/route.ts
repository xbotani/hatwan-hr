import { NextResponse } from 'next/server'
import { prisma, isRecordNotFoundError } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

// Unrestricted request deletion for ADMIN / CEO roles only.
// An EMPLOYEE (or any other non-admin role) is rejected with 403 by requireAdmin.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) {
    return session
  }

  try {
    await prisma.request.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
