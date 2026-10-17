import { defineConfig } from '@playwright/test'

const port = 3100
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: `bun run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
})
