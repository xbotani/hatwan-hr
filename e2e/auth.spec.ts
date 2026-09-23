import { test, expect } from '@playwright/test'

test('invalid credentials show an error message', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('wrong@hatwan.com')
  await page.locator('input[type="password"]').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()
})

test('valid credentials redirect to the dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('admin@hatwan.com')
  await page.locator('input[type="password"]').fill('hatwan@123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
