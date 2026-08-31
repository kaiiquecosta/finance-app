import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { mockAuthenticatedApp } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'

const outDir = resolve(process.cwd(), 'public/landing/walkthrough')

test.describe.configure({ mode: 'serial' })

test('capture walkthrough screenshots', async ({ page }) => {
  test.setTimeout(120_000)
  test.skip(process.env.CAPTURE_WALKTHROUGH !== '1', 'Set CAPTURE_WALKTHROUGH=1 to generate PNGs')

  mkdirSync(outDir, { recursive: true })
  await page.setViewportSize({ width: 1280, height: 800 })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const shots: Array<{ file: string; path: string; ready?: RegExp | string }> = [
    { file: 'overview-app.png', path: '/app' },
    { file: 'cards.png', path: '/app/cartoes', ready: 'Nubank' },
    { file: 'investments.png', path: '/app/investimentos', ready: 'Investimentos' },
    { file: 'goals.png', path: '/app/metas', ready: 'Metas' },
  ]

  for (const shot of shots) {
    await page.goto(shot.path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(900)
    if (shot.ready) await page.getByText(shot.ready).first().waitFor({ timeout: 10000 })
    await page.screenshot({ path: resolve(outDir, shot.file) })
  }

  await page.goto('/app')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Assistente de gastos' }).click()
  await page.waitForTimeout(800)
  const textbox = page.getByRole('textbox').last()
  await textbox.waitFor({ timeout: 10000 })
  await textbox.fill('Gastei 45 reais no mercado')
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(outDir, 'assistant.png') })
})
