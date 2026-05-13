import { test, expect } from '@playwright/test'

async function mockPublicApiRoutes(page) {
  await page.route('**/api/visits', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: true, id: 'e2e-session' }),
      })
    }
    return route.fulfill({ status: 404, body: 'e2e: only POST' })
  })
  await page.route('**/api/session-events', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: true }),
      })
    }
    return route.fulfill({ status: 404, body: 'e2e: only POST' })
  })
  await page.route('**/api/registrations', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: true, id: 'e2e', raffleNumber: '777' }),
      })
    }
    return route.fulfill({ status: 404, body: 'e2e: only POST' })
  })
}

test.describe('Регистрация', () => {
  test('полный сценарий до экрана успеха, шаг 4 после генерации вопроса', async ({ page }) => {
    await mockPublicApiRoutes(page)
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /как к вам обращаться/i })).toBeVisible()

    await page.getByPlaceholder(/мария иванова/i).fill('E2E Тестовый Пользователь')
    await page.getByRole('button', { name: 'Далее' }).click()

    await expect(page.getByRole('heading', { name: /рабочая почта/i })).toBeVisible()
    await page.locator('input[type="email"]').fill('e2e-test@example.com')
    await page.getByRole('button', { name: 'Далее' }).click()

    await expect(page.getByRole('heading', { name: /регламентов компании/i })).toBeVisible()
    await page.getByRole('button', { name: 'Далее' }).click()

    await expect(page.getByText(/генерация вопроса|подготовка вопроса/i).first()).toBeVisible({ timeout: 5000 })

    const finish = page.getByRole('button', { name: 'Завершить' })
    await expect(finish).toBeDisabled()

    await expect(page.getByRole('heading', { name: /^вопрос$/i })).toBeVisible({ timeout: 15_000 })
    await expect(finish).toBeEnabled()

    await page.getByRole('radio', { name: /адрес отправителя/i }).check()
    await finish.click()

    await expect(page.getByRole('heading', { name: /регистрация принята/i })).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/register\/complete/)
  })
})
