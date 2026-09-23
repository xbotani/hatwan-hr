import {
  createRequestSchema,
  getRequestsQuerySchema,
  decisionSchema
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('createRequestSchema', () => {
    it('accepts a valid request payload', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        departmentId: 'dept-1',
        itemName: 'Office Laptop',
        explanation: 'Need a new laptop for development work.',
        necessityRating: 7
      })
      expect(result.success).toBe(true)
    })

    it('rejects when necessityRating is below 1', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        departmentId: 'dept-1',
        itemName: 'Office Laptop',
        explanation: 'Need a laptop.',
        necessityRating: 0
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'between 1 and 10'
        )
      }
    })

    it('rejects when necessityRating is above 10', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        departmentId: 'dept-1',
        itemName: 'Office Laptop',
        explanation: 'Need a laptop.',
        necessityRating: 11
      })
      expect(result.success).toBe(false)
    })

    it('allows decimal ratings to be rejected (must be integer)', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        departmentId: 'dept-1',
        itemName: 'Office Laptop',
        explanation: 'Need a laptop.',
        necessityRating: 7.5
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        necessityRating: 5
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0])
        expect(fields).toContain('departmentId')
        expect(fields).toContain('itemName')
        expect(fields).toContain('explanation')
      }
    })

    it('rejects empty itemName', () => {
      const result = createRequestSchema.safeParse({
        companyId: 'company-1',
        departmentId: 'dept-1',
        itemName: '',
        explanation: 'stuff',
        necessityRating: 5
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getRequestsQuerySchema', () => {
    it('accepts an empty query', () => {
      const result = getRequestsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('accepts companyId only', () => {
      const result = getRequestsQuerySchema.safeParse({
        companyId: 'company-1'
      })
      expect(result.success).toBe(true)
    })

    it('accepts a valid status', () => {
      const result = getRequestsQuerySchema.safeParse({
        status: 'PENDING'
      })
      expect(result.success).toBe(true)
    })

    it('rejects an invalid status', () => {
      const result = getRequestsQuerySchema.safeParse({
        status: 'INVALID'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('decisionSchema', () => {
    it('accepts APPROVE', () => {
      const result = decisionSchema.safeParse({ action: 'APPROVE' })
      expect(result.success).toBe(true)
    })

    it('accepts REJECT', () => {
      const result = decisionSchema.safeParse({ action: 'REJECT' })
      expect(result.success).toBe(true)
    })

    it('rejects unknown actions', () => {
      const result = decisionSchema.safeParse({ action: 'DELETE' })
      expect(result.success).toBe(false)
    })
  })
})
