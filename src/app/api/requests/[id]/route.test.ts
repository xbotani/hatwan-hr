/** @jest-environment node */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { DELETE } from '@/app/api/requests/[id]/route'

jest.mock('@/lib/prisma', () => ({
  prisma: { request: { delete: jest.fn() } },
  isRecordNotFoundError: (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2025'
}))
jest.mock('@/lib/session', () => ({
  requireAdmin: jest.fn()
}))

const mockRequestDelete = prisma.request.delete as jest.Mock
const mockRequireAdmin = requireAdmin as jest.Mock

describe('DELETE /api/requests/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ id: 'admin-1', role: 'CEO' })
  })

  it('deletes a request regardless of its status', async () => {
    mockRequestDelete.mockResolvedValue({ id: 'req-1' })

    const res = await DELETE({} as Request, { params: { id: 'req-1' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(mockRequestDelete).toHaveBeenCalledWith({ where: { id: 'req-1' } })
  })

  it('returns 404 when the request does not exist', async () => {
    const notFound = Object.assign(new Error('Record not found'), { code: 'P2025' })
    mockRequestDelete.mockRejectedValue(notFound)

    const res = await DELETE({} as Request, { params: { id: 'missing' } })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Request not found')
  })

  it('returns 401 when unauthenticated', async () => {
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )

    const res = await DELETE({} as Request, { params: { id: 'req-1' } })
    expect(res.status).toBe(401)
    expect(mockRequestDelete).not.toHaveBeenCalled()
  })

  it('returns 403 when the user is not an admin/CEO', async () => {
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    )

    const res = await DELETE({} as Request, { params: { id: 'req-1' } })
    expect(res.status).toBe(403)
    expect(mockRequestDelete).not.toHaveBeenCalled()
  })
})
