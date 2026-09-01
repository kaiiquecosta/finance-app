/**
 * Captura frames do filme da coxinha (sem video Playwright — mais estável).
 * npx tsx scripts/capture-film-frames.ts
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public/landing/walkthrough/film/frames')
const W = 390
const H = 844

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    baseURL: 'http://localhost:5173',
  })
  const page = await context.newPage()

  // Inline minimal auth mock by importing helpers is hard in tsx; use route + storage via page scripts.
  // Prefer going through the app's e2e helpers via dynamic import.
  const { mockAuthenticatedApp } = await import('../e2e/helpers/mockAuthenticatedApp')
  const { seedMarianaPersona } = await import('../e2e/helpers/seedMarianaPersona')
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const now = new Date().toISOString()
  const items = [
    { id: 101, author_id: 'u1', title: 'Integração Open Finance', body: 'Conectar banco.', status: 'backlog', created_at: now, updated_at: now },
    { id: 103, author_id: 'u1', title: 'Exportar mês em PDF', body: 'Extrato visual.', status: 'planned', created_at: now, updated_at: now },
    { id: 105, author_id: 'u1', title: 'Assistente Flux', body: 'Registre gastos.', status: 'done', created_at: now, updated_at: now },
  ]
  await page.route('**/rest/v1/community_items**', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) })
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { id?: number; title?: string; body?: string }
      const next = {
        id: body.id ?? 220,
        author_id: 'u1',
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
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ item_id: 101, user_id: 'u2' }]) }),
  )
  await page.route('**/rest/v1/community_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  let n = 0
  const shot = async (tag: string, hold = 4) => {
    await page.waitForTimeout(250)
    for (let i = 0; i < hold; i++) {
      n += 1
      const file = path.join(OUT, `${String(n).padStart(4, '0')}-${tag}.jpg`)
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 })
      await page.waitForTimeout(80)
    }
    console.log('shot', tag, '→', n)
  }

  await page.goto('http://localhost:5173/app', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape').catch(() => undefined)
  await shot('overview', 6)

  await page.getByRole('button', { name: 'Assistente de gastos' }).click({ timeout: 10000 })
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /Agora não|Entendi/i }).first().click({ timeout: 2000 }).catch(() => undefined)
  await shot('assistant-open', 5)

  const input = page.getByRole('textbox').last()
  await input.click()
  await shot('assistant-focus', 3)
  const phrase = 'Gastei 8 reais na coxinha'
  for (let i = 1; i <= phrase.length; i++) {
    await input.fill(phrase.slice(0, i))
    if (i % 3 === 0 || i === phrase.length) await shot(`type-${i}`, 1)
  }
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1200)
  await shot('assistant-done', 8)

  await page.keyboard.press('Escape').catch(() => undefined)
  await page.getByRole('button', { name: /Fechar/i }).first().click({ timeout: 2000 }).catch(() => undefined)
  await page.waitForTimeout(600)
  await shot('overview-after', 5)

  await page.getByRole('link', { name: /Cartões/i }).first().click()
  await page.waitForTimeout(1200)
  await shot('cards', 8)
  await page.mouse.wheel(0, 160)
  await page.waitForTimeout(400)
  await shot('cards-scroll', 5)

  await page.getByRole('link', { name: /Metas/i }).first().click()
  await page.waitForTimeout(1200)
  await shot('goals', 7)

  await page.getByRole('link', { name: /Comunidade/i }).first().click()
  await page.waitForTimeout(1200)
  await shot('community', 7)

  await page.getByRole('button', { name: /Nova sugestão/i }).click()
  await page.waitForTimeout(500)
  await page.getByPlaceholder('Ex.: Modo escuro automático').fill('Atalho pra coxinha favorita')
  await page.getByPlaceholder('Como isso te ajudaria no dia a dia?').fill('Registrar lanches rápidos em um toque.')
  await shot('community-modal', 8)

  await page.getByRole('button', { name: /Publicar sugestão/i }).click()
  await page.waitForTimeout(900)
  await shot('community-published', 6)

  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForTimeout(1000)
  await shot('end-overview', 6)

  console.log('TOTAL_FRAMES', n)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
