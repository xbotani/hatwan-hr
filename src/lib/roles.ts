import type { Role } from '@/types'

/**
 * Edge-safe role definitions. This module must not import any server-only
 * (Node) modules so it can be shared between route handlers and middleware.
 */
export const ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'CEO']

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as Role)
}
