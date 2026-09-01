import { test } from '@playwright/test'
import { mockAuthenticatedApp, MOCK_USER_ID } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public/landing/walkthrough/film/frames')

/**
 * Frames do filme: coxinha no estabelecimento → Gasto rápido → Cartões → Metas → Comunidade.
 * npx playwright test e2e/capture-film-frames.spec.ts --project=chromium
 */
test('capture film frames coxinha story', async ({ page }) => {
  test.setTimeout(90_000)
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const now = new Date().toISOString()
  const items = [
    {
      id: 101,
      author_id: MOCK_USER_ID,
      title: 'Integração Open Finance',
      body: 'Conectar banco.',
      status: 'backlog',
      created_at: now,
      updated_at: now,
    },
    {
      id: 103,
      author_id: MOCK_USER_ID,
      title: 'Exportar mês em PDF',
      body: 'Extrato visual.',
      status: 'planned',
      created_at: now,
      updated_at: now,
    },
    {
      id: 105,
      author_id: MOCK_USER_ID,
      title: 'Assistente Flux',
      body: 'Registre gastos.',
      status: 'done',
      created_at: now,
      updated_at: now,
    },
  ]
  await page.route('**/rest/v1/community_items**', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) })
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { id?: number; title?: string; body?: string }
      const next = {
        id: body.id ?? 220,
        author_id: MOCK_USER_ID,
        title: body.title ?? 'Nova',
        body: body.body ?? '',
        status: 'backlog',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      items.unshift(next)
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([next]) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  await page.route('**/rest/v1/community_likes**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ item_id: 101, user_id: 'u2' }]),
    }),
  )
  await page.route('**/rest/v1/community_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  // Bloqueia APIs que podem travar (quotes, etc.)
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    if (url.includes('quote') || url.includes('yahoo') || url.includes('brapi')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    return route.fallback()
  })

  let n = 0
  const shot = async (tag: string, hold = 3) => {
    for (let i = 0; i < hold; i++) {
      n += 1
      await page.screenshot({
        path: path.join(OUT, `${String(n).padStart(4, '0')}-${tag}.jpg`),
        type: 'jpeg',
        quality: 90,
      })
    }
  }

  await page.goto('/app', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(900)
  await page.keyboard.press('Escape').catch(() => undefined)
  await page.getByRole('button', { name: /Fechar/i }).first().click({ timeout: 800 }).catch(() => undefined)
  await shot('overview', 4)

  // Gasto rápido = registrar a coxinha no sistema
  await page.getByRole('button', { name: /Gasto rápido/i }).click({ timeout: 8000 })
  await page.waitForTimeout(500)
  await shot('gasto-open', 3)

  const desc = page.getByPlaceholder(/Mercado|iFood|Descri/i).first()
  await desc.click({ timeout: 5000 })
  const phrase = 'Coxinha — padaria da esquina'
  for (let i = 1; i <= phrase.length; i++) {
    await desc.fill(phrase.slice(0, i))
    if (i % 5 === 0 || i === phrase.length) await shot(`desc-${i}`, 1)
  }

  const valor = page.getByPlaceholder(/0,00|Valor/i).or(page.locator('input[inputmode="decimal"]')).first()
  if (await valor.count()) {
    await valor.click()
    await valor.fill('8,00')
    await shot('valor', 2)
  }

  // Categoria Alimentação / Mercado se existir
  const cat = page.getByRole('button', { name: /Alimentação|Mercado|Lazer/i }).first()
  if (await cat.count()) {
    await cat.click()
    await shot('categoria', 2)
  }

  await page.getByRole('button', { name: /^Adicionar$|Salvar|Lançar/i }).last().click({ timeout: 5000 })
  await page.waitForTimeout(800)
  await shot('gasto-saved', 4)

  await page.getByRole('link', { name: /Cartões/i }).first().click({ timeout: 8000 })
  await page.waitForTimeout(800)
  await shot('cards', 5)
  await page.mouse.wheel(0, 140)
  await shot('cards-scroll', 3)

  await page.getByRole('link', { name: /Metas/i }).first().click({ timeout: 8000 })
  await page.waitForTimeout(800)
  await shot('goals', 5)

  await page.getByRole('link', { name: /Comunidade/i }).first().click({ timeout: 8000 })
  await page.waitForTimeout(800)
  await shot('community', 5)

  await page.getByRole('button', { name: /Nova sugestão/i }).click({ timeout: 5000 })
  await page.waitForTimeout(350)
  await page.getByPlaceholder('Ex.: Modo escuro automático').fill('Atalho pra coxinha favorita')
  await page.getByPlaceholder('Como isso te ajudaria no dia a dia?').fill('Registrar lanches rápidos em um toque.')
  await shot('community-modal', 5)

  await page.getByRole('button', { name: /Publicar sugestão/i }).click({ timeout: 5000 })
  await page.waitForTimeout(700)
  await shot('community-published', 4)

  await page.getByRole('link', { name: /Visão geral/i }).first().click({ timeout: 8000 })
  await page.waitForTimeout(700)
  await shot('end', 4)

  console.log('TOTAL_FRAMES', n)
})
