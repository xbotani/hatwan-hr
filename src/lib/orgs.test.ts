import { prisma } from '@/lib/prisma'
import {
  listCompanies,
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
  deleteUser,
  setUserActive,
  userHasRequests,
  getDepartment,
  companyHasChildren,
  listDepartments,
  listUsers
} from '@/lib/orgs'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    company: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    branch: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    department: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    user: { create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    request: { count: jest.fn() }
  }
}))

const m = {
  companyFindMany: prisma.company.findMany as jest.Mock,
  companyCreate: prisma.company.create as jest.Mock,
  companyUpdate: prisma.company.update as jest.Mock,
  companyDelete: prisma.company.delete as jest.Mock,
  branchCreate: prisma.branch.create as jest.Mock,
  branchUpdate: prisma.branch.update as jest.Mock,
  branchDelete: prisma.branch.delete as jest.Mock,
  departmentCreate: prisma.department.create as jest.Mock,
  departmentUpdate: prisma.department.update as jest.Mock,
  departmentDelete: prisma.department.delete as jest.Mock,
  departmentFindUnique: prisma.department.findUnique as jest.Mock,
  departmentFindMany: prisma.department.findMany as jest.Mock,
  departmentCount: prisma.department.count as jest.Mock,
  userCreate: prisma.user.create as jest.Mock,
  userUpdate: prisma.user.update as jest.Mock,
  userDelete: prisma.user.delete as jest.Mock,
  userFindMany: prisma.user.findMany as jest.Mock,
  userCount: prisma.user.count as jest.Mock,
  requestCount: prisma.request.count as jest.Mock
}

describe('orgs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists companies with nested relations', async () => {
    m.companyFindMany.mockResolvedValue([{ id: 'c1', name: 'Hatwan' }])
    const result = await listCompanies()
    expect(m.companyFindMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'asc' } }))
    expect(result).toEqual([{ id: 'c1', name: 'Hatwan' }])
  })

  it('creates a company', async () => {
    m.companyCreate.mockResolvedValue({ id: 'c1', name: 'Hatwan' })
    const result = await createCompany({ name: 'Hatwan', ceoName: 'Mohammed Ahmed Ali' })
    expect(m.companyCreate).toHaveBeenCalledWith({ data: { name: 'Hatwan', ceoName: 'Mohammed Ahmed Ali' } })
    expect(result).toEqual({ id: 'c1', name: 'Hatwan' })
  })

  it('updates a company', async () => {
    m.companyUpdate.mockResolvedValue({ id: 'c1', name: 'Hatwan 2' })
    await updateCompany('c1', { name: 'Hatwan 2' })
    expect(m.companyUpdate).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'Hatwan 2' } })
  })

  it('deletes a company', async () => {
    m.companyDelete.mockResolvedValue({ id: 'c1' })
    await deleteCompany('c1')
    expect(m.companyDelete).toHaveBeenCalledWith({ where: { id: 'c1' } })
  })

  it('creates a branch', async () => {
    m.branchCreate.mockResolvedValue({ id: 'b1' })
    await createBranch({ companyId: 'c1', name: 'Erbil', location: 'Erbil' })
    expect(m.branchCreate).toHaveBeenCalledWith({ data: { companyId: 'c1', name: 'Erbil', location: 'Erbil' } })
  })

  it('updates a branch', async () => {
    m.branchUpdate.mockResolvedValue({ id: 'b1' })
    await updateBranch('b1', { name: 'Erbil 2' })
    expect(m.branchUpdate).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { name: 'Erbil 2' } })
  })

  it('deletes a branch', async () => {
    m.branchDelete.mockResolvedValue({ id: 'b1' })
    await deleteBranch('b1')
    expect(m.branchDelete).toHaveBeenCalledWith({ where: { id: 'b1' } })
  })

  it('creates a department', async () => {
    m.departmentCreate.mockResolvedValue({ id: 'd1' })
    await createDepartment({ companyId: 'c1', branchId: 'b1', name: 'IT' })
    expect(m.departmentCreate).toHaveBeenCalledWith({ data: { companyId: 'c1', branchId: 'b1', name: 'IT' } })
  })

  it('updates a department', async () => {
    m.departmentUpdate.mockResolvedValue({ id: 'd1' })
    await updateDepartment('d1', { name: 'IT 2' })
    expect(m.departmentUpdate).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { name: 'IT 2' } })
  })

  it('deletes a department', async () => {
    m.departmentDelete.mockResolvedValue({ id: 'd1' })
    await deleteDepartment('d1')
    expect(m.departmentDelete).toHaveBeenCalledWith({ where: { id: 'd1' } })
  })

  it('creates a user', async () => {
    m.userCreate.mockResolvedValue({ id: 'u1' })
    await createUser({ companyId: 'c1', email: 'a@b.c', name: 'Zana', passwordHash: 'hash' })
    expect(m.userCreate).toHaveBeenCalledWith({
      data: { companyId: 'c1', email: 'a@b.c', name: 'Zana', passwordHash: 'hash' }
    })
  })

  it('updates a user including password and department', async () => {
    m.userUpdate.mockResolvedValue({ id: 'u1' })
    await updateUser('u1', { name: 'Zana K', passwordHash: 'newhash', companyId: 'c2', departmentId: 'd2' })
    expect(m.userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'Zana K', passwordHash: 'newhash', companyId: 'c2', departmentId: 'd2' }
    })
  })

  it('deletes a user', async () => {
    m.userDelete.mockResolvedValue({ id: 'u1' })
    await deleteUser('u1')
    expect(m.userDelete).toHaveBeenCalledWith({ where: { id: 'u1' } })
  })

  it('soft-deletes (deactivates) a user', async () => {
    m.userUpdate.mockResolvedValue({ id: 'u1', isActive: false })
    await setUserActive('u1', false)
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { isActive: false } })
  })

  it('reactivates a user', async () => {
    m.userUpdate.mockResolvedValue({ id: 'u1', isActive: true })
    await setUserActive('u1', true)
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { isActive: true } })
  })

  it('reports a user has requests when they are the requester', async () => {
    m.requestCount.mockResolvedValue(2)
    const result = await userHasRequests('u1')
    expect(m.requestCount).toHaveBeenCalledWith({ where: { requesterId: 'u1' } })
    expect(result).toBe(true)
  })

  it('reports a user has no requests when the count is zero', async () => {
    m.requestCount.mockResolvedValue(0)
    const result = await userHasRequests('u1')
    expect(result).toBe(false)
  })

  it('fetches a department by id', async () => {
    m.departmentFindUnique.mockResolvedValue({ id: 'd1', name: 'IT', companyId: 'c1' })
    const result = await getDepartment('d1')
    expect(m.departmentFindUnique).toHaveBeenCalledWith({ where: { id: 'd1' } })
    expect(result).toEqual({ id: 'd1', name: 'IT', companyId: 'c1' })
  })

  it('returns null when fetching a non-existent department', async () => {
    m.departmentFindUnique.mockResolvedValue(null)
    const result = await getDepartment('missing')
    expect(result).toBeNull()
  })

  it('reports a company has children when departments exist', async () => {
    m.departmentCount.mockResolvedValue(3)
    m.userCount.mockResolvedValue(0)
    const result = await companyHasChildren('c1')
    expect(result).toBe(true)
  })

  it('reports a company has children when users exist', async () => {
    m.departmentCount.mockResolvedValue(0)
    m.userCount.mockResolvedValue(2)
    const result = await companyHasChildren('c1')
    expect(result).toBe(true)
  })

  it('reports a company has no children when empty', async () => {
    m.departmentCount.mockResolvedValue(0)
    m.userCount.mockResolvedValue(0)
    const result = await companyHasChildren('c1')
    expect(result).toBe(false)
  })

  it('lists departments for a company', async () => {
    m.departmentFindMany.mockResolvedValue([{ id: 'd1', name: 'IT' }])
    const result = await listDepartments('c1')
    expect(m.departmentFindMany).toHaveBeenCalledWith({ where: { companyId: 'c1' }, orderBy: { name: 'asc' } })
    expect(result).toEqual([{ id: 'd1', name: 'IT' }])
  })

  it('lists users for a company', async () => {
    m.userFindMany.mockResolvedValue([{ id: 'u1', name: 'Zana' }])
    const result = await listUsers('c1')
    expect(m.userFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: 'c1' } }))
    expect(result).toEqual([{ id: 'u1', name: 'Zana' }])
  })
})