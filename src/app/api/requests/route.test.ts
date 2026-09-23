/** @jest-environment node */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/session'
import { POST, GET } from '@/app/api/requests/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    department: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    request: { create: jest.fn(), findMany: jest.fn() }
  }
}))
jest.mock('@/lib/session', () => ({
  getSessionUser: jest.fn()
}))

const mockDeptFindFirst = prisma.department.findFirst as jest.Mock
const mockUserFindUnique = prisma.user.findUnique as jest.Mock
const mockRequestCreate = prisma.request.create as jest.Mock
const mockRequestFindMany = prisma.request.findMany as jest.Mock
const mockGetSessionUser = getSessionUser as jest.Mock

function makeRequest(body?: unknown) {
  return {
    json: async () => body ?? {},
    nextUrl: { searchParams: new URLSearchParams() }
  } as unknown as NextRequest
}

const adminBody = {
  companyId: 'c-1',
  departmentId: 'dept-1',
  itemName: 'Laptop',
  explanation: 'Need laptop',
  necessityRating: 8
}

describe('Requests API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionUser.mockResolvedValue({ id: 'user-1', companyId: 'c-1', role: 'EMPLOYEE' })
  })

  describe('POST /api/requests', () => {
    describe('as non-admin (EMPLOYEE)', () => {
      it('derives company/department from the user record and ignores body identifiers', async () => {
        mockUserFindUnique.mockResolvedValue({ id: 'user-1', companyId: 'c-1', departmentId: 'dept-1' })
        mockRequestCreate.mockResolvedValue({ id: 'req-1', status: 'PENDING', itemName: 'Laptop' })

        const res = await POST(
          makeRequest({
            ...adminBody,
            companyId: 'evil-company',
            departmentId: 'evil-dept',
            necessityRating: 6
          })
        )
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.status).toBe('PENDING')

        const arg = mockRequestCreate.mock.calls[0][0]
        expect(arg.data).toEqual(
          expect.objectContaining({
            itemName: 'Laptop',
            explanation: 'Need laptop',
            necessityRating: 6,
            companyId: 'c-1',
            departmentId: 'dept-1',
            requesterId: 'user-1',
            estimatedCost: 0
          })
        )
        expect(arg.data.companyId).toBe('c-1')
        expect(arg.data.departmentId).toBe('dept-1')
      })

      it('returns 400 when the user has no department assigned', async () => {
        mockUserFindUnique.mockResolvedValue({ id: 'user-1', companyId: 'c-1', departmentId: null })
        const res = await POST(makeRequest({ itemName: 'Laptop', explanation: 'Need', necessityRating: 6 }))
        expect(res.status).toBe(400)
        expect(mockRequestCreate).not.toHaveBeenCalled()
      })

      it('returns 400 when a required field is missing', async () => {
        const res = await POST(makeRequest({ itemName: 'Laptop', explanation: 'Need' }))
        expect(res.status).toBe(400)
        expect(mockRequestCreate).not.toHaveBeenCalled()
      })
    })

    describe('as admin', () => {
      beforeEach(() => {
        mockGetSessionUser.mockResolvedValue({ id: 'admin-1', companyId: 'c-1', role: 'COMPANY_ADMIN' })
      })

      it('creates a pending request when valid', async () => {
        mockDeptFindFirst.mockResolvedValue({ id: 'dept-1', companyId: 'c-1' })
        mockRequestCreate.mockResolvedValue({ id: 'req-1', status: 'PENDING', itemName: 'Laptop' })

        const res = await POST(makeRequest(adminBody))
        expect(res.status).toBe(201)
        const arg = mockRequestCreate.mock.calls[0][0]
        expect(arg.data).toEqual(
          expect.objectContaining({ companyId: 'c-1', departmentId: 'dept-1', requesterId: 'admin-1' })
        )
      })

      it('returns 403 when the company does not match the session', async () => {
        const res = await POST(makeRequest({ ...adminBody, companyId: 'other-company' }))
        expect(res.status).toBe(403)
        expect(mockRequestCreate).not.toHaveBeenCalled()
      })

      it('returns 404 when the department does not belong to the company', async () => {
        mockDeptFindFirst.mockResolvedValue(null)
        const res = await POST(makeRequest(adminBody))
        expect(res.status).toBe(404)
      })
    })

    it('returns 401 when unauthenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null)
      const res = await POST(makeRequest(adminBody))
      expect(res.status).toBe(401)
      expect(mockRequestCreate).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/requests', () => {
    it('scopes non-admin (EMPLOYEE) to their own requests', async () => {
      mockRequestFindMany.mockResolvedValue([])
      const res = await GET(makeRequest())
      expect(res.status).toBe(200)
      const where = mockRequestFindMany.mock.calls[0][0].where
      expect(where.requesterId).toBe('user-1')
    })

    it('allows admins to apply company/department/status filters', async () => {
      mockGetSessionUser.mockResolvedValue({ id: 'admin-1', companyId: 'c-1', role: 'CEO' })
      mockRequestFindMany.mockResolvedValue([])
      const url = new URL('http://localhost/api/requests?companyId=c1&departmentId=d1&status=PENDING')
      const req = { nextUrl: url } as unknown as NextRequest
      await GET(req)
      const where = mockRequestFindMany.mock.calls[0][0].where
      expect(where.companyId).toBe('c1')
      expect(where.departmentId).toBe('d1')
      expect(where.status).toBe('PENDING')
      expect(where.requesterId).toBeUndefined()
    })

    it('returns 401 when unauthenticated', async () => {
      mockGetSessionUser.mockResolvedValue(null)
      const res = await GET(makeRequest())
      expect(res.status).toBe(401)
      expect(mockRequestFindMany).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid status value', async () => {
      const url = new URL('http://localhost/api/requests?status=INVALID')
      const req = { nextUrl: url } as unknown as NextRequest
      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })
})