import { prisma } from './prisma'
import type { RequestStatus } from '@/types'

export interface CreateRequestInput {
  companyId: string
  departmentId: string
  requesterId: string
  itemName: string
  explanation: string
  necessityRating: number
  estimatedCost?: number
}

export async function createRequest(data: CreateRequestInput) {
  return prisma.request.create({
    data: {
      companyId: data.companyId,
      departmentId: data.departmentId,
      requesterId: data.requesterId,
      itemName: data.itemName,
      explanation: data.explanation,
      necessityRating: data.necessityRating,
      estimatedCost: data.estimatedCost ?? 0,
      status: 'PENDING'
    }
  })
}

export type DecideResult =
  | { ok: true; request: unknown }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_REVIEWED' }

export async function decideRequest(
  id: string,
  action: 'APPROVE' | 'REJECT',
  reviewerId?: string | null
): Promise<DecideResult> {
  const existing = await prisma.request.findUnique({ where: { id } })

  if (!existing) {
    return { ok: false, reason: 'NOT_FOUND' }
  }

  if (existing.status !== 'PENDING') {
    return { ok: false, reason: 'ALREADY_REVIEWED' }
  }

  const request = await prisma.request.update({
    where: { id },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewDate: new Date(),
      reviewedBy: reviewerId ?? null
    }
  })

  return { ok: true, request }
}

export async function listRequests(filters?: {
  companyId?: string
  departmentId?: string
  status?: RequestStatus
}) {
  return prisma.request.findMany({
    where: {
      companyId: filters?.companyId || undefined,
      departmentId: filters?.departmentId || undefined,
      status: filters?.status || undefined
    },
    include: {
      department: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } }
    },
    orderBy: { requestDate: 'desc' }
  })
}

export async function getRequestForPrint(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      company: true,
      department: true,
      requester: { select: { name: true } },
      reviewer: { select: { name: true } }
    }
  })
}