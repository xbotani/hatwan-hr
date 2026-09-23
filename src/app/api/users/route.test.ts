/** @jest-environment node */
import { createUser, getDepartment } from '@/lib/orgs'
import { requireAdmin } from '@/lib/session'
import { POST } from '@/app/api/users/route'

jest.mock('@/lib/orgs', () => ({
  listUsers: jest.fn(),
  createUser: jest.fn(),
  getDepartment: jest.fn()
}))
jest.mock('@/lib/session', () => ({
  requireAdmin: jest.fn()
}))
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}))
jest.mock('@/lib/prisma', () => ({
  isUniqueConstraintError: (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
}))

const mockCreateUser = createUser as jest.Mock
const mockGetDepartment = getDepartment as jest.Mock
const mockRequireAdmin = requireAdmin as jest.Mock

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as Request
}

const validBody = {
  departmentId: 'dept-1',
  email: 'new.user@hatwan.com',
  name: 'New User',
  password: 'secret123',
  role: 'EMPLOYEE'
}

describe('POST /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'COMPANY_ADMIN' })
    mockGetDepartment.mockResolvedValue({ id: 'dept-1', companyId: 'c-1' })
  })

  it('returns 201 for a valid user', async () => {
    mockCreateUser.mockResolvedValue({ id: 'u1', email: 'new.user@hatwan.com' })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
  })

  it('returns 409 when the email already exists (unique constraint)', async () => {
    const conflict = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    mockCreateUser.mockRejectedValue(conflict)

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)

    const data = await res.json()
    expect(data.error).toBe('Email already in use')
  })

  it('returns 400 when the password is empty', async () => {
    const res = await POST(makeRequest({ ...validBody, password: undefined }))
    expect(res.status).toBe(400)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('returns 400 when the password is too short', async () => {
    const res = await POST(makeRequest({ ...validBody, password: '123' }))
    expect(res.status).toBe(400)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })
})