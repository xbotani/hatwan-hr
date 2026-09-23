/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { PATCH } from '@/app/api/requests/[id]/decision/route'

jest.mock('@/lib/prisma', () => ({
  prisma: { request: { findUnique: jest.fn(), update: jest.fn() } }
}))
jest.mock('@/lib/session', () => ({
  requireAdmin: jest.fn()
}))

const mockFindUnique = prisma.request.findUnique as jest.Mock
const mockUpdate = prisma.request.update as jest.Mock
const mockRequireAdmin = requireAdmin as jest.Mock

function makeDecisionRequest(action: string) {
  return { json: async () => ({ action }) } as unknown as NextRequest
}

describe('Decision API PATCH /api/requests/[id]/decision', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ id: 'reviewer-1', role: 'CEO' })
  })

  it('approves a pending request and stamps the reviewer', async () => {
    mockFindUnique.mockResolvedValue({ id: 'req-1', status: 'PENDING' })
    mockUpdate.mockResolvedValue({ id: 'req-1', status: 'APPROVED' })

    const res = await PATCH(makeDecisionRequest('APPROVE'), { params: { id: 'req-1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('APPROVED')

    const arg = mockUpdate.mock.calls[0][0]
    expect(arg.where).toEqual({ id: 'req-1' })
    expect(arg.data.status).toBe('APPROVED')
    expect(arg.data.reviewDate).toBeInstanceOf(Date)
    expect(arg.data.reviewedBy).toBe('reviewer-1')
  })

  it('rejects a pending request', async () => {
    mockFindUnique.mockResolvedValue({ id: 'req-2', status: 'PENDING' })
    mockUpdate.mockResolvedValue({ id: 'req-2', status: 'REJECTED' })

    const res = await PATCH(makeDecisionRequest('REJECT'), { params: { id: 'req-2' } })
    expect(res.status).toBe(200)
    expect(mockUpdate.mock.calls[0][0].data.status).toBe('REJECTED')
  })

  it('returns 400 for an invalid action', async () => {
    const res = await PATCH(makeDecisionRequest('DELETE'), { params: { id: 'req-1' } })
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 404 when the request does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await PATCH(makeDecisionRequest('APPROVE'), { params: { id: 'missing' } })
    expect(res.status).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 409 when the request was already reviewed', async () => {
    mockFindUnique.mockResolvedValue({ id: 'req-3', status: 'APPROVED' })
    const res = await PATCH(makeDecisionRequest('APPROVE'), { params: { id: 'req-3' } })
    expect(res.status).toBe(409)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 401 when unauthenticated', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await PATCH(makeDecisionRequest('APPROVE'), { params: { id: 'req-1' } })
    expect(res.status).toBe(401)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 403 when the user is not an admin', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
    const res = await PATCH(makeDecisionRequest('APPROVE'), { params: { id: 'req-1' } })
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})