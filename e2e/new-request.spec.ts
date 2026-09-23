import { test, expect } from '@playwright/test'

test('submit a procurement request', async ({ page }) => {
  await page.goto('/requests/new')
  await expect(page.getByRole('heading', { name: 'New Request' })).toBeVisible()

  // Company + Department (cascading selects)
  await page.getByRole('combobox').first().selectOption({ label: 'Hatwan Company' })
  const deptSelect = page.getByRole('combobox').nth(1)
  await deptSelect.selectOption({ label: 'Information Technology' })

  // Item + Explanation
  await page.getByPlaceholder('e.g. Dell Latitude 7450 Laptop').fill('E2E Test Laptop')
  await page.getByPlaceholder('Describe why this item is needed').fill('Automated end-to-end test request')

  // Necessity rating 1-10
  await page.locator('input[type="range"]').fill('8')

  await page.getByRole('button', { name: 'Submit Request' }).click()

  await expect(page.getByText('Request submitted successfully.')).toBeVisible()
})
