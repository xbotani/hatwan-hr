import { test, expect } from '@playwright/test'

test('print view renders the Sorani CEO signature block', async ({ page }) => {
  await page.goto('/requests/seed-request-1/print')
  await expect(page.getByText('واژووی کۆتایی / بەڕێوەبەری گشتی')).toBeVisible()
})
