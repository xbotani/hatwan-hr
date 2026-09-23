import { test, expect } from '@playwright/test'

test('approving a pending request updates its status badge', async ({ page }) => {
  await page.goto('/requests')
  await expect(page.getByRole('heading', { name: 'Procurement Requests' })).toBeVisible()

  // Locate the first row that still has an "Approve" button.
  const pendingRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Approve' }) })
    .first()
  await expect(pendingRow).toBeVisible()

  // Capture the item name to re-find the row after the table reloads.
  const itemCell = await pendingRow.locator('td').first().innerText()
  const itemName = itemCell.split('\n')[0].trim()

  await pendingRow.getByRole('button', { name: 'Approve' }).click()

  // After the reload the same row now shows an Approved badge and no Approve button.
  const updatedRow = page.getByRole('row').filter({ hasText: itemName })
  await expect(updatedRow.getByText('Approved')).toBeVisible()
  await expect(updatedRow.getByRole('button', { name: 'Approve' })).toHaveCount(0)
})
