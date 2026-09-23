import { prisma } from './prisma'
import type { Role } from '@/types'

export async function listCompanies() {
  return prisma.company.findMany({
    include: {
      branches: { include: { departments: true } },
      departments: true,
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          branchId: true,
          departmentId: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createCompany(data: { name: string; ceoName?: string }) {
  return prisma.company.create({ data })
}

export async function updateCompany(id: string, data: { name?: string; ceoName?: string }) {
  return prisma.company.update({ where: { id }, data })
}

export async function deleteCompany(id: string) {
  return prisma.company.delete({ where: { id } })
}

export async function createBranch(data: {
  companyId: string
  name: string
  location?: string | null
}) {
  return prisma.branch.create({ data })
}

export async function updateBranch(
  id: string,
  data: { name?: string; location?: string | null }
) {
  return prisma.branch.update({ where: { id }, data })
}

export async function deleteBranch(id: string) {
  return prisma.branch.delete({ where: { id } })
}

export async function createDepartment(data: {
  companyId: string
  branchId?: string | null
  name: string
}) {
  return prisma.department.create({ data })
}

export async function updateDepartment(
  id: string,
  data: { name?: string; branchId?: string | null }
) {
  return prisma.department.update({ where: { id }, data })
}

export async function deleteDepartment(id: string) {
  return prisma.department.delete({ where: { id } })
}

export async function createUser(data: {
  companyId: string
  email: string
  name: string
  passwordHash: string
  role?: Role
  branchId?: string | null
  departmentId?: string | null
}) {
  return prisma.user.create({ data })
}

export async function updateUser(
  id: string,
  data: {
    email?: string
    name?: string
    role?: Role
    companyId?: string
    branchId?: string | null
    departmentId?: string | null
    passwordHash?: string
    isActive?: boolean
  }
) {
  return prisma.user.update({ where: { id }, data })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

/**
 * Soft-deletes or reactivates a user by flipping `isActive`. This preserves the
 * user's request history (and its foreign keys) instead of hard-deleting.
 */
export async function setUserActive(id: string, isActive: boolean) {
  return prisma.user.update({ where: { id }, data: { isActive } })
}

/**
 * Returns true when the user has submitted at least one procurement request.
 * The `requests.requesterId` foreign key is `ON DELETE RESTRICT`, so a user with
 * requests cannot be deleted without first removing/reassigning those requests.
 */
export async function userHasRequests(id: string) {
  const count = await prisma.request.count({ where: { requesterId: id } })
  return count > 0
}

export async function getDepartment(id: string) {
  return prisma.department.findUnique({ where: { id } })
}

export async function companyHasChildren(id: string) {
  const [departments, users] = await Promise.all([
    prisma.department.count({ where: { companyId: id } }),
    prisma.user.count({ where: { companyId: id } })
  ])
  return departments > 0 || users > 0
}

export async function listDepartments(companyId: string) {
  return prisma.department.findMany({
    where: { companyId },
    orderBy: { name: 'asc' }
  })
}

export async function listUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      companyId: true,
      branchId: true,
      departmentId: true
    }
  })
}
