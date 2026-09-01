import { defineConfig, devices } from '@playwright/test'
import { loadEnvLocal } from './e2e/helpers/loadEnvLocal'

loadEnvLocal()

const captureVideo = process.env.CAPTURE_WALKTHROUGH === '1'
const CAPTURE_W = 3840
const CAPTURE_H = 2160

/**
 * E2E dos fluxos públicos (landing, auth, legal) — não dependem de conta
 * autenticada. Fluxos logados (transações, cartões...) exigem um projeto
 * Supabase de teste dedicado; ver docs/ROADMAP.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: !captureVideo,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: captureVideo
      ? {
          mode: 'on',
          size: { width: CAPTURE_W, height: CAPTURE_H },
        }
      : 'off',
    // Grava em 4K com UI mais preenchida (viewport QHD + scale 1.5 ≈ retina 4K)
    viewport: captureVideo
      ? { width: 2560, height: 1440 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: captureVideo ? 1.5 : undefined,
  },
  outputDir: captureVideo ? 'test-results/walkthrough-video' : 'test-results',
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
