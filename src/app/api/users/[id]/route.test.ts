/** @jest-environment node */
import { NextResponse } from 'next/server'
import { updateUser, setUserActive } from '@/lib/orgs'
import { requireAdmin } from '@/lib/session'
import { DELETE, PATCH } from '@/app/api/users/[id]/route'

jest.mock('@/lib/orgs', () => ({
  updateUser: jest.fn(),
  getDepartment: jest.fn(),
  setUserActive: jest.fn()
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
    (error as { code?: string }).code === 'P2002',
  isRecordNotFoundError: (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2025'
}))

const mockUpdateUser = updateUser as jest.Mock
const mockSetUserActive = setUserActive as jest.Mock
const mockRequireAdmin = requireAdmin as jest.Mock

function makeRequest(body?: unknown) {
  return { json: async () => body ?? {} } as unknown as Request
}

describe('users/[id] soft delete & reactivation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'COMPANY_ADMIN' })
  })

  describe('DELETE /api/users/[id]', () => {
    it('soft-deletes by setting isActive to false', async () => {
      mockSetUserActive.mockResolvedValue({ id: 'u1', isActive: false })

      const res = await DELETE(makeRequest(), { params: { id: 'u1' } })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, isActive: false })
      expect(mockSetUserActive).toHaveBeenCalledWith('u1', false)
    })

    it('returns 404 when the user does not exist', async () => {
      const notFound = Object.assign(new Error('Record not found'), { code: 'P2025' })
      mockSetUserActive.mockRejectedValue(notFound)

      const res = await DELETE(makeRequest(), { params: { id: 'missing' } })
      expect(res.status).toBe(404)
      expect((await res.json()).error).toBe('User not found')
    })

    it('returns 401 when unauthenticated', async () => {
      mockRequireAdmin.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )

      const res = await DELETE(makeRequest(), { params: { id: 'u1' } })
      expect(res.status).toBe(401)
      expect(mockSetUserActive).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/users/[id]', () => {
    it('reactivates a user when isActive is true', async () => {
      mockUpdateUser.mockResolvedValue({ id: 'u1', isActive: true })

      const res = await PATCH(makeRequest({ isActive: true }), { params: { id: 'u1' } })
      expect(res.status).toBe(200)
      expect(mockUpdateUser).toHaveBeenCalledWith('u1', { isActive: true })
    })
  })
})

