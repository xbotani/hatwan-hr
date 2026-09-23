import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Detects Prisma's unique-constraint violation error (code P2002),
 * which is raised when inserting a value that already exists for a
 * unique field such as `users.email`.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  )
}

/**
 * Detects Prisma's foreign-key constraint violation (code P2003), raised when
 * deleting or updating a record that is still referenced by another table.
 */
export function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2003'
  )
}

/**
 * Detects Prisma's "record not found" error (code P2025), raised when an
 * update/delete targets a row that no longer exists.
 */
export function isRecordNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2025'
  )
}
