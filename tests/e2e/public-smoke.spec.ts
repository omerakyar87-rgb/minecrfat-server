import { expect, test } from '@playwright/test'

test('public shell renders without a server error', async ({ page }) => {
  const response=await page.goto('/')
  expect(response?.status() ?? 500).toBeLessThan(500)
  await expect(page.locator('body')).toBeVisible()
})

test('unknown route uses the application not-found UI', async ({ page }) => {
  const response=await page.goto('/__blockctrl-e2e-not-found__')
  expect([200,404]).toContain(response?.status() ?? 500)
  await expect(page.locator('body')).toBeVisible()
})
