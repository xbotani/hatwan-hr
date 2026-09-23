import { test, expect } from '@playwright/test'

test('organization cascade: company → department → users', async ({ page }) => {
  await page.goto('/admin/organization')
  await expect(page.getByRole('heading', { name: 'Organization Admin' })).toBeVisible()

  // Level 1: select a company
  await page.getByRole('button', { name: /Hatwan Company/ }).click()

  // Level 2: departments for that company load
  const itDept = page.getByRole('button', { name: 'Information Technology' })
  await expect(itDept).toBeVisible()

  // Level 3: click a department and its users load
  await itDept.click()
  await expect(page.getByText('IT Department Head')).toBeVisible()
  await expect(page.getByText('Zana Karim')).toBeVisible()
})
