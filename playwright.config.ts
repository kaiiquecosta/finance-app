import { defineConfig, devices } from '@playwright/test'
import { loadEnvLocal } from './e2e/helpers/loadEnvLocal'

loadEnvLocal()

/**
 * E2E dos fluxos públicos (landing, auth, legal) — não dependem de conta
 * autenticada. Fluxos logados (transações, cartões...) exigem um projeto
 * Supabase de teste dedicado; ver docs/ROADMAP.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      ...process.env,
    },
  },
})
