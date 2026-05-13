import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PW_PORT || 5180)
const host = process.env.PW_HOST || '127.0.0.1'

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PW_BASE_URL || `http://${host}:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --host ${host} --port ${String(port)}`,
    url: `http://${host}:${port}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
