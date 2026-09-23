import { prisma } from '@/lib/prisma'
import { createRequest, decideRequest, listRequests, getRequestForPrint } from '@/lib/requests'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    request: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() }
  }
}))

const create = prisma.request.create as jest.Mock
const findUnique = prisma.request.findUnique as jest.Mock
const update = prisma.request.update as jest.Mock
const findMany = prisma.request.findMany as jest.Mock

describe('requests lib', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a pending request with a default cost of zero', async () => {
    create.mockResolvedValue({ id: 'r1', status: 'PENDING' })
    const result = await createRequest({
      companyId: 'c1',
      departmentId: 'd1',
      requesterId: 'u1',
      itemName: 'Laptop',
      explanation: 'need',
      necessityRating: 8
    })
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'PENDING', estimatedCost: 0, requesterId: 'u1' })
    })
    expect(result.status).toBe('PENDING')
  })

  it('creates a request with a provided estimated cost', async () => {
    create.mockResolvedValue({ id: 'r2', estimatedCost: 1450 })
    await createRequest({
      companyId: 'c1',
      departmentId: 'd1',
      requesterId: 'u1',
      itemName: 'Laptop',
      explanation: 'need',
      necessityRating: 9,
      estimatedCost: 1450
    })
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ estimatedCost: 1450 })
    })
  })

  it('approves a pending request with a timestamp', async () => {
    findUnique.mockResolvedValue({ id: 'r1', status: 'PENDING' })
    update.mockResolvedValue({ id: 'r1', status: 'APPROVED' })

    const result = await decideRequest('r1', 'APPROVE', 'reviewer-1')

    expect(result).toEqual({ ok: true, request: { id: 'r1', status: 'APPROVED' } })
    const arg = update.mock.calls[0][0]
    expect(arg.data.status).toBe('APPROVED')
    expect(arg.data.reviewDate).toBeInstanceOf(Date)
    expect(arg.data.reviewedBy).toBe('reviewer-1')
  })

  it('rejects a pending request', async () => {
    findUnique.mockResolvedValue({ id: 'r2', status: 'PENDING' })
    update.mockResolvedValue({ id: 'r2', status: 'REJECTED' })

    const result = await decideRequest('r2', 'REJECT', 'reviewer-1')

    expect(result.ok).toBe(true)
    expect(update.mock.calls[0][0].data.status).toBe('REJECTED')
  })

  it('returns ALREADY_REVIEWED for a non-pending request', async () => {
    findUnique.mockResolvedValue({ id: 'r1', status: 'APPROVED' })
    const result = await decideRequest('r1', 'REJECT', null)
    expect(result).toEqual({ ok: false, reason: 'ALREADY_REVIEWED' })
    expect(update).not.toHaveBeenCalled()
  })

  it('returns NOT_FOUND for a missing request', async () => {
    findUnique.mockResolvedValue(null)
    const result = await decideRequest('missing', 'APPROVE', null)
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' })
    expect(update).not.toHaveBeenCalled()
  })

  it('sets reviewedBy to null when no reviewer is supplied', async () => {
    findUnique.mockResolvedValue({ id: 'r1', status: 'PENDING' })
    update.mockResolvedValue({ id: 'r1', status: 'APPROVED' })

    await decideRequest('r1', 'APPROVE', null)

    expect(update.mock.calls[0][0].data.reviewedBy).toBeNull()
  })

  it('lists requests without filters', async () => {
    findMany.mockResolvedValue([{ id: 'r1' }])
    const result = await listRequests()
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, orderBy: { requestDate: 'desc' } })
    )
    expect(result).toEqual([{ id: 'r1' }])
  })

  it('lists requests with filters', async () => {
    findMany.mockResolvedValue([])
    await listRequests({ companyId: 'c1', departmentId: 'd1', status: 'PENDING' })
    const where = findMany.mock.calls[0][0].where
    expect(where.companyId).toBe('c1')
    expect(where.departmentId).toBe('d1')
    expect(where.status).toBe('PENDING')
  })

  it('fetches a request for print with relations', async () => {
    findUnique.mockResolvedValue({ id: 'r1', itemName: 'Laptop' })
    const result = await getRequestForPrint('r1')
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1' }, include: expect.objectContaining({ company: true }) })
    )
    expect(result).toEqual({ id: 'r1', itemName: 'Laptop' })
  })
})