import { test } from '@playwright/test'
import { mockAuthenticatedApp } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'

/**
 * Grava uso real do app (estilo dia a dia) para o walkthrough da landing.
 * CAPTURE_WALKTHROUGH=1 npm run capture:walkthrough-video
 */
test('record day-to-day walkthrough video', async ({ page }) => {
  test.setTimeout(180_000)
  test.skip(process.env.CAPTURE_WALKTHROUGH !== '1', 'Set CAPTURE_WALKTHROUGH=1')

  await page.setViewportSize({ width: 1280, height: 720 })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const wait = (ms: number) => page.waitForTimeout(ms)

  // —— Overview ——
  await page.goto('/app')
  await page.waitForLoadState('networkidle')
  await wait(2200)

  // Scroll leve como usuário lendo
  await page.mouse.wheel(0, 180)
  await wait(900)
  await page.mouse.wheel(0, 220)
  await wait(1100)
  await page.mouse.wheel(0, -280)
  await wait(800)

  // Hover / click Gasto rápido se existir
  const quick = page.getByRole('button', { name: /Gasto rápido/i })
  if (await quick.count()) {
    await quick.first().hover()
    await wait(500)
    await quick.first().click()
    await wait(900)
    await page.keyboard.press('Escape')
    await wait(600)
  }

  // —— Transações ——
  await page.getByRole('link', { name: /Transações/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(1800)
  await page.mouse.wheel(0, 160)
  await wait(1000)

  // —— Cartões ——
  await page.getByRole('link', { name: /Cartões/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2000)
  await page.mouse.wheel(0, 200)
  await wait(1200)
  await page.mouse.wheel(0, 180)
  await wait(1000)

  // —— Metas ——
  await page.getByRole('link', { name: /Metas/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2000)
  await page.mouse.wheel(0, 140)
  await wait(1200)

  // —— Investimentos ——
  await page.getByRole('link', { name: /Investimentos/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)
  await page.mouse.wheel(0, 200)
  await wait(1400)

  // —— Assistente (falar/digitar) ——
  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(900)

  await page.getByRole('button', { name: 'Assistente de gastos' }).click()
  await wait(900)

  const later = page.getByRole('button', { name: /Agora não|Entendi/i })
  if (await later.count()) {
    await later.first().click().catch(() => undefined)
    await wait(400)
  }

  const input = page.getByRole('textbox').last()
  await input.click()
  await wait(300)
  const phrase = 'Gastei 45 reais no mercado'
  for (const ch of phrase) {
    await input.pressSequentially(ch, { delay: 48 })
  }
  await wait(700)
  await page.keyboard.press('Enter')
  await wait(2200)

  // Fecha assistente
  const closeAssist = page.getByRole('button', { name: /Fechar/i })
  if (await closeAssist.count()) await closeAssist.first().click().catch(() => undefined)
  await wait(800)

  // —— Comunidade ——
  await page.getByRole('link', { name: /Comunidade/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)
  await page.mouse.wheel(0, 120)
  await wait(1400)

  // Volta overview — encerramento
  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2000)
})
