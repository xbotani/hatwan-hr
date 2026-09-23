import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('admin@hatwan.com')
  await page.locator('input[type="password"]').fill('hatwan@123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: authFile })
})
