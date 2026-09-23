import {
  createRequestSchema,
  userSchema,
  companySchema,
  branchSchema,
  departmentSchema
} from '@/lib/validation'

describe('validation edge cases', () => {
  it('rejects a necessity rating of 11', () => {
    const result = createRequestSchema.safeParse({
      companyId: 'c1',
      departmentId: 'd1',
      itemName: 'x',
      explanation: 'y',
      necessityRating: 11
    })
    expect(result.success).toBe(false)
  })

  it('rejects an explanation longer than 2000 characters', () => {
    const result = createRequestSchema.safeParse({
      companyId: 'c1',
      departmentId: 'd1',
      itemName: 'x',
      explanation: 'a'.repeat(2001),
      necessityRating: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects an item name longer than 500 characters', () => {
    const result = createRequestSchema.safeParse({
      companyId: 'c1',
      departmentId: 'd1',
      itemName: 'a'.repeat(501),
      explanation: 'y',
      necessityRating: 5
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative estimated cost', () => {
    const result = createRequestSchema.safeParse({
      companyId: 'c1',
      departmentId: 'd1',
      itemName: 'x',
      explanation: 'y',
      necessityRating: 5,
      estimatedCost: -1
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from itemName', () => {
    const result = createRequestSchema.safeParse({
      companyId: 'c1',
      departmentId: 'd1',
      itemName: '  Laptop  ',
      explanation: 'need',
      necessityRating: 5
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.itemName).toBe('Laptop')
    }
  })

  it('rejects an email longer than 254 characters', () => {
    const email = 'a'.repeat(250) + '@example.com'
    const result = userSchema.safeParse({ departmentId: 'd1', email, name: 'Zana' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = userSchema.safeParse({ departmentId: 'd1', email: 'not-an-email', name: 'Zana' })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 6 characters', () => {
    const result = userSchema.safeParse({ departmentId: 'd1', email: 'a@b.c', name: 'Zana', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects a password longer than 128 characters', () => {
    const result = userSchema.safeParse({ departmentId: 'd1', email: 'a@b.c', name: 'Zana', password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
  })

  it('rejects a user without a department', () => {
    const result = userSchema.safeParse({ email: 'a@b.c', name: 'Zana' })
    expect(result.success).toBe(false)
  })

  it('rejects a blank company name', () => {
    const result = companySchema.safeParse({ name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a branch without a company', () => {
    const result = branchSchema.safeParse({ name: 'Erbil' })
    expect(result.success).toBe(false)
  })

  it('rejects a department without a company', () => {
    const result = departmentSchema.safeParse({ name: 'IT' })
    expect(result.success).toBe(false)
  })
})