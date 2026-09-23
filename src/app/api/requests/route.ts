import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createRequestSchema,
  employeeRequestSchema,
  getRequestsQuerySchema
} from '@/lib/validation'
import { getSessionUser } from '@/lib/session'
import { isAdminRole } from '@/lib/roles'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Non-admin requesters (EMPLOYEE / DEPT_HEAD): the server derives the
    // company + department from the user's profile and IGNORES any
    // client-supplied identifiers (defense against tenant spoofing).
    if (!isAdminRole(session.role)) {
      const parsed = employeeRequestSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { itemName, explanation, necessityRating } = parsed.data

      const user = await prisma.user.findUnique({ where: { id: session.id } })
      if (!user?.companyId || !user?.departmentId) {
        return NextResponse.json(
          { error: 'Account is not assigned to a department' },
          { status: 400 }
        )
      }

      const request = await prisma.request.create({
        data: {
          itemName,
          explanation,
          necessityRating,
          companyId: user.companyId,
          departmentId: user.departmentId,
          requesterId: session.id,
          estimatedCost: 0,
          status: 'PENDING'
        }
      })

      return NextResponse.json(request, { status: 201 })
    }

    // Admin path: full control with tenant isolation.
    const parsed = createRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      companyId,
      departmentId,
      itemName,
      explanation,
      necessityRating,
      estimatedCost
    } = parsed.data

    if (session.role !== 'SUPER_ADMIN' && companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId }
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found in company' },
        { status: 404 }
      )
    }

    const request = await prisma.request.create({
      data: {
        companyId,
        departmentId,
        itemName,
        explanation,
        necessityRating,
        estimatedCost: estimatedCost ?? 0,
        requesterId: session.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const query = {
      companyId: searchParams.get('companyId') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      status: searchParams.get('status') || undefined
    }

    const parsed = getRequestsQuerySchema.safeParse(query)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyId, departmentId, status } = parsed.data

    const where: Record<string, unknown> = {}

    if (!isAdminRole(session.role)) {
      // Non-admins can only ever see their own requests.
      where.requesterId = session.id
    } else {
      where.companyId = companyId || undefined
      where.departmentId = departmentId || undefined
    }
    where.status = (status as unknown) || undefined

    const requests = await prisma.request.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } }
      },
      orderBy: { requestDate: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
