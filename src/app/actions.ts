'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import {
  createCompany,
  updateCompany,
  deleteCompany,
  createBranch,
  updateBranch,
  deleteBranch,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createUser,
  updateUser,
  deleteUser
} from '@/lib/orgs'
import { createRequest } from '@/lib/requests'

type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'DEPT_HEAD' | 'EMPLOYEE' | 'CEO'

export async function createCompanyAction(data: { name: string; ceoName?: string }) {
  const company = await createCompany(data)
  revalidatePath('/settings')
  return company
}

export async function updateCompanyAction(
  id: string,
  data: { name?: string; ceoName?: string }
) {
  const company = await updateCompany(id, data)
  revalidatePath('/settings')
  return company
}

export async function deleteCompanyAction(id: string) {
  await deleteCompany(id)
  revalidatePath('/settings')
}

export async function createBranchAction(data: {
  companyId: string
  name: string
  location?: string | null
}) {
  const branch = await createBranch(data)
  revalidatePath('/settings')
  return branch
}

export async function updateBranchAction(
  id: string,
  data: { name?: string; location?: string | null }
) {
  const branch = await updateBranch(id, data)
  revalidatePath('/settings')
  return branch
}

export async function deleteBranchAction(id: string) {
  await deleteBranch(id)
  revalidatePath('/settings')
}

export async function createDepartmentAction(data: {
  companyId: string
  branchId?: string | null
  name: string
}) {
  const department = await createDepartment(data)
  revalidatePath('/settings')
  return department
}

export async function updateDepartmentAction(
  id: string,
  data: { name?: string; branchId?: string | null }
) {
  const department = await updateDepartment(id, data)
  revalidatePath('/settings')
  return department
}

export async function deleteDepartmentAction(id: string) {
  await deleteDepartment(id)
  revalidatePath('/settings')
}

export async function createUserAction(data: {
  companyId: string
  email: string
  name: string
  password?: string
  role?: Role
  branchId?: string | null
  departmentId?: string | null
}) {
  const { password, ...rest } = data
  const passwordHash = await bcrypt.hash(password || 'hatwan@123', 12)
  const user = await createUser({ ...rest, passwordHash })
  revalidatePath('/settings')
  return user
}

export async function updateUserAction(
  id: string,
  data: {
    email?: string
    name?: string
    role?: Role
    branchId?: string | null
    departmentId?: string | null
  }
) {
  const user = await updateUser(id, data)
  revalidatePath('/settings')
  return user
}

export async function deleteUserAction(id: string) {
  await deleteUser(id)
  revalidatePath('/settings')
}

export async function createRequestAction(data: {
  companyId: string
  departmentId: string
  requesterId: string
  itemName: string
  explanation: string
  necessityRating: number
  estimatedCost?: number
}) {
  const request = await createRequest(data)
  revalidatePath('/dashboard')
  return request
}