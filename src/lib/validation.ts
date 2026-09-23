import { z } from 'zod'

const id = (name: string) =>
  z.string().min(1, `${name} is required`).max(100, `${name} is too long`)

export const createRequestSchema = z.object({
  companyId: id('companyId'),
  departmentId: id('departmentId'),
  itemName: z
    .string()
    .trim()
    .min(1, 'itemName is required')
    .max(500, 'itemName must be 500 characters or fewer'),
  explanation: z
    .string()
    .trim()
    .min(1, 'explanation is required')
    .max(2000, 'explanation must be 2000 characters or fewer'),
  necessityRating: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 10')
    .max(10, 'Rating must be between 1 and 10'),
  estimatedCost: z
    .number()
    .min(0, 'Estimated cost cannot be negative')
    .max(100_000_000, 'Estimated cost is too large')
    .optional()
})

// Minimal payload accepted from non-admin (EMPLOYEE / DEPT_HEAD) requesters.
// The server derives companyId/departmentId from the authenticated user, so
// those fields are intentionally NOT part of this schema.
export const employeeRequestSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, 'itemName is required')
    .max(500, 'itemName must be 500 characters or fewer'),
  explanation: z
    .string()
    .trim()
    .min(1, 'explanation is required')
    .max(2000, 'explanation must be 2000 characters or fewer'),
  necessityRating: z
    .number()
    .int()
    .min(1, 'Necessity is required')
    .max(10, 'Necessity is invalid')
})

export const getRequestsQuerySchema = z.object({
  companyId: z.string().max(100).optional(),
  departmentId: z.string().max(100).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional()
})

export const decisionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'])
})

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be 200 characters or fewer'),
  ceoName: z.string().trim().max(200).optional()
})

export const branchSchema = z.object({
  companyId: id('companyId'),
  name: z.string().trim().min(1, 'Branch name is required').max(200),
  location: z.string().trim().max(500).optional().nullable()
})

export const departmentSchema = z.object({
  companyId: id('companyId'),
  branchId: z.string().max(100).optional().nullable(),
  name: z.string().trim().min(1, 'Department name is required').max(200)
})

export const userSchema = z.object({
  departmentId: id('departmentId'),
  email: z
    .string()
    .trim()
    .email('A valid email is required')
    .max(254, 'Email must be 254 characters or fewer'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  role: z
    .enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CEO'])
    .default('EMPLOYEE'),
  isActive: z.boolean().optional()
})

export const reportQuerySchema = z.object({
  companyId: id('companyId'),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
  departmentId: z.string().max(100).optional()
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type GetRequestsQuery = z.infer<typeof getRequestsQuerySchema>
export type DecisionInput = z.infer<typeof decisionSchema>
