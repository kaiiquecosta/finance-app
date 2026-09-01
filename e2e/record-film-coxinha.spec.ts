import { test } from '@playwright/test'
import { mockAuthenticatedApp, MOCK_USER_ID } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'

/**
 * Filme mobile: acabou de comprar uma coxinha e registra no Flux.
 * CAPTURE_WALKTHROUGH=1 CAPTURE_FILM=1 npm run capture:film-coxinha
 */
test('record coxinha product film mobile', async ({ page }) => {
  test.setTimeout(180_000)
  test.skip(process.env.CAPTURE_WALKTHROUGH !== '1', 'Set CAPTURE_WALKTHROUGH=1')

  await page.setViewportSize({ width: 390, height: 844 })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)

  const now = new Date().toISOString()
  const items = [
    {
      id: 101,
      author_id: MOCK_USER_ID,
      title: 'Integração Open Finance',
      body: 'Conectar banco e importar extrato.',
      status: 'backlog',
      created_at: now,
      updated_at: now,
    },
    {
      id: 103,
      author_id: MOCK_USER_ID,
      title: 'Exportar mês em PDF',
      body: 'Extrato visual do mês.',
      status: 'planned',
      created_at: now,
      updated_at: now,
    },
    {
      id: 105,
      author_id: MOCK_USER_ID,
      title: 'Assistente Flux',
      body: 'Registre gastos falando.',
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
        id: body.id ?? 200,
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
      body: JSON.stringify([
        { item_id: 101, user_id: 'u2' },
        { item_id: 105, user_id: 'u2' },
      ]),
    }),
  )
  await page.route('**/rest/v1/community_comments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  const wait = (ms: number) => page.waitForTimeout(ms)

  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = '*, *::before, *::after { cursor: none !important; }'
    document.documentElement.appendChild(style)
  })

  await page.goto('/app', { waitUntil: 'domcontentloaded' })
  await wait(2000)
  await page.keyboard.press('Escape').catch(() => undefined)
  await wait(800)

  // Assistente — coxinha
  await page.getByRole('button', { name: 'Assistente de gastos' }).click()
  await wait(800)
  await page.getByRole('button', { name: /Agora não|Entendi/i }).first().click().catch(() => undefined)
  await wait(400)
  const input = page.getByRole('textbox').last()
  await input.click()
  await wait(300)
  await input.pressSequentially('Gastei 8 reais na coxinha', { delay: 48 })
  await wait(700)
  await page.keyboard.press('Enter')
  await wait(2200)
  await page.keyboard.press('Escape').catch(() => undefined)
  await page.getByRole('button', { name: /Fechar/i }).first().click().catch(() => undefined)
  await wait(900)
  await page.mouse.wheel(0, 160)
  await wait(1000)

  // Cartões
  await page.getByRole('link', { name: /Cartões/i }).first().click()
  await wait(2000)
  await page.mouse.wheel(0, 140)
  await wait(1200)

  // Metas
  await page.getByRole('link', { name: /Metas/i }).first().click()
  await wait(1800)
  await page.mouse.wheel(0, 100)
  await wait(1000)

  // Comunidade
  await page.getByRole('link', { name: /Comunidade/i }).first().click()
  await wait(1600)
  await page.getByRole('button', { name: /Nova sugestão/i }).click()
  await wait(900)
  const titleField = page.getByPlaceholder('Ex.: Modo escuro automático')
  await titleField.fill('Atalho pra coxinha favorita')
  await wait(400)
  await page.getByPlaceholder('Como isso te ajudaria no dia a dia?').fill('Registrar lanches rápidos em um toque.')
  await wait(500)
  await page.getByRole('button', { name: /Publicar sugestão/i }).click()
  await wait(1400)

  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await wait(1800)
})
