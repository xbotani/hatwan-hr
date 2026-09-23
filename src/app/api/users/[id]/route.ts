import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { userSchema } from '@/lib/validation'
import { updateUser, getDepartment, setUserActive } from '@/lib/orgs'
import { isUniqueConstraintError, isRecordNotFoundError } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'DEPT_HEAD' | 'EMPLOYEE' | 'CEO'

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
    const parsed = userSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { password, departmentId, ...rest } = parsed.data

    const data: {
      email?: string
      name?: string
      role?: Role
      companyId?: string
      departmentId?: string
      passwordHash?: string
      isActive?: boolean
    } = { ...rest }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12)
    }

    if (departmentId) {
      const department = await getDepartment(departmentId)
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
      data.departmentId = departmentId
      data.companyId = department.companyId
    }

    const user = await updateUser(params.id, data)
    return NextResponse.json(user)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
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
    // Soft delete: deactivate the user instead of hard-deleting, so their
    // request history (and its foreign keys) remains intact.
    const user = await setUserActive(params.id, false)
    return NextResponse.json({ success: true, isActive: user.isActive })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}