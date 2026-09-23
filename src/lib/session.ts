import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { ADMIN_ROLES } from './roles'
import type { Role } from '@/types'

export interface SessionUser {
  id: string
  role?: Role
  companyId?: string
  name?: string | null
  email?: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) return null
  return {
    id: user.id,
    role: user.role,
    companyId: user.companyId,
    name: user.name ?? null,
    email: user.email ?? null
  }
}

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && ADMIN_ROLES.includes(user.role as Role)
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}