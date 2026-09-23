import type { DefaultSession } from 'next-auth'

// Extended Role type aligned with Prisma enum
export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'DEPT_HEAD' | 'EMPLOYEE' | 'CEO'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface RequestData {
  id: string
  companyId: string
  departmentId: string
  requesterId: string
  itemName: string
  explanation: string
  necessityRating: number
  status: RequestStatus
  requestDate: string
  reviewDate?: string | null
  reviewedBy?: string | null
  department?: {
    id: string
    name: string
  }
  requester?: {
    id: string
    name: string
    email: string
  }
  reviewer?: {
    id: string
    name: string
  }
}

export interface DecisionRequest {
  action: 'APPROVE' | 'REJECT'
}

// Session augmentation
declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string
      role?: Role
      companyId?: string
    } & DefaultSession['user']
  }
}
