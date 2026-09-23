import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { userSchema } from '@/lib/validation'
import { listUsers, createUser, getDepartment } from '@/lib/orgs'
import { isUniqueConstraintError } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId')
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }
    return NextResponse.json(await listUsers(companyId))
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
    const parsed = userSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: first?.message ?? 'Validation failed',
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    }

    const { password, ...data } = parsed.data

    // Enforce the Company -> Department -> User hierarchy: derive the
    // company from the department so a user always belongs to its department.
    const department = await getDepartment(data.departmentId)
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({
      companyId: department.companyId,
      departmentId: department.id,
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}