import { test } from '@playwright/test'
import { mockAuthenticatedApp } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public/landing/walkthrough/mobile')

test('capture mobile screens for apple walkthrough', async ({ page }) => {
  test.setTimeout(120_000)
  fs.mkdirSync(OUT, { recursive: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const now = new Date().toISOString()
  const items = [
    { id: 101, author_id: 'u1', title: 'Integração Open Finance', body: 'Conectar banco e importar extrato.', status: 'backlog', created_at: now, updated_at: now },
    { id: 102, author_id: 'u1', title: 'Relatório anual para IR', body: 'Resumo de rendimentos.', status: 'backlog', created_at: now, updated_at: now },
    { id: 103, author_id: 'u1', title: 'Exportar mês em PDF', body: 'Extrato visual do mês.', status: 'planned', created_at: now, updated_at: now },
    { id: 104, author_id: 'u1', title: 'Alertas de vencimento', body: 'Aviso antes de faturas.', status: 'in_progress', created_at: now, updated_at: now },
    { id: 105, author_id: 'u1', title: 'Assistente Flux', body: 'Registre gastos falando.', status: 'done', created_at: now, updated_at: now },
  ]
  await page.route('**/rest/v1/community_items**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) })
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
  })
  await page.route('**/rest/v1/community_likes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { item_id: 101, user_id: 'u2' },
        { item_id: 101, user_id: 'u3' },
        { item_id: 103, user_id: 'u2' },
        { item_id: 105, user_id: 'u2' },
      ]),
    }),
  )
  await page.route('**/rest/v1/community_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  const shot = async (name: string) => {
    await page.waitForTimeout(900)
    await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 92 })
  }

  await page.goto('/app')
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('Escape').catch(() => undefined)
  await shot('overview')

  await page.getByRole('link', { name: /Cartões/i }).first().click()
  await page.waitForLoadState('networkidle')
  await shot('cards')

  await page.getByRole('link', { name: /Metas/i }).first().click()
  await page.waitForLoadState('networkidle')
  await shot('goals')

  await page.getByRole('link', { name: /Investimentos/i }).first().click()
  await page.waitForLoadState('networkidle')
  await shot('invest')

  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Assistente de gastos' }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /Agora não|Entendi/i }).first().click().catch(() => undefined)
  await shot('assistant')
  await page.keyboard.press('Escape').catch(() => undefined)
  await page.waitForTimeout(400)

  await page.getByRole('link', { name: /Comunidade/i }).first().click()
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('Escape').catch(() => undefined)
  await shot('community')

  await page.getByRole('button', { name: /Nova sugestão/i }).click()
  await page.waitForTimeout(500)
  await page.getByPlaceholder('Ex.: Modo escuro automático').fill('Modo casal no orçamento')
  await page.getByPlaceholder('Como isso te ajudaria no dia a dia?').fill('Duas pessoas no mesmo orçamento, com metas compartilhadas.')
  await shot('community-modal')
})
