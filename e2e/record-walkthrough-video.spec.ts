import { test } from '@playwright/test'
import { mockAuthenticatedApp, MOCK_USER_ID } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'

const W = 2560
const H = 1440

async function seedCommunityBoard(page: import('@playwright/test').Page) {
  const now = new Date().toISOString()
  const items = [
    {
      id: 101,
      author_id: MOCK_USER_ID,
      title: 'Integração Open Finance',
      body: 'Conectar banco e importar extrato automaticamente.',
      status: 'backlog',
      created_at: now,
      updated_at: now,
    },
    {
      id: 102,
      author_id: MOCK_USER_ID,
      title: 'Relatório anual para IR',
      body: 'Resumo de rendimentos e gastos dedutíveis do ano.',
      status: 'backlog',
      created_at: now,
      updated_at: now,
    },
    {
      id: 103,
      author_id: MOCK_USER_ID,
      title: 'Exportar mês em PDF',
      body: 'Extrato visual do mês para arquivar.',
      status: 'planned',
      created_at: now,
      updated_at: now,
    },
    {
      id: 104,
      author_id: MOCK_USER_ID,
      title: 'Alertas de vencimento',
      body: 'Aviso antes de faturas e contas fixas.',
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    },
    {
      id: 105,
      author_id: MOCK_USER_ID,
      title: 'Assistente Flux',
      body: 'Registre gastos falando ou digitando.',
      status: 'done',
      created_at: now,
      updated_at: now,
    },
    {
      id: 106,
      author_id: MOCK_USER_ID,
      title: 'Investidor completo',
      body: 'Ações, FIIs, ETFs e cripto ao vivo.',
      status: 'done',
      created_at: now,
      updated_at: now,
    },
  ]

  const likes = [
    { item_id: 101, user_id: 'u2' },
    { item_id: 101, user_id: 'u3' },
    { item_id: 101, user_id: 'u4' },
    { item_id: 102, user_id: 'u2' },
    { item_id: 103, user_id: 'u2' },
    { item_id: 103, user_id: 'u3' },
    { item_id: 103, user_id: MOCK_USER_ID },
    { item_id: 104, user_id: 'u2' },
    { item_id: 105, user_id: 'u2' },
    { item_id: 105, user_id: 'u3' },
    { item_id: 105, user_id: 'u4' },
    { item_id: 105, user_id: 'u5' },
    { item_id: 106, user_id: 'u2' },
    { item_id: 106, user_id: 'u3' },
  ]

  const comments = [
    { id: 1, item_id: 101, author_id: 'u2', body: 'Isso seria incrível', created_at: now },
    { id: 2, item_id: 103, author_id: 'u3', body: 'Quero isso!', created_at: now },
    { id: 3, item_id: 105, author_id: 'u4', body: 'Já uso todo dia', created_at: now },
  ]

  let likeStore = [...likes]

  await page.route('**/rest/v1/community_items**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${items.length - 1}/${items.length}` },
        body: JSON.stringify(items),
      })
    }
    if (method === 'POST') {
      const body = route.request().postDataJSON() as {
        id?: number
        title?: string
        body?: string
        status?: string
        author_id?: string
      }
      const next = {
        id: body.id ?? 200 + items.length,
        author_id: body.author_id ?? MOCK_USER_ID,
        title: body.title ?? 'Nova sugestão',
        body: body.body ?? '',
        status: body.status ?? 'backlog',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      items.unshift(next)
      // PostgREST com Prefer: return=representation devolve array
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([next]),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.route('**/rest/v1/community_likes**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(likeStore),
      })
    }
    if (method === 'POST') {
      const body = route.request().postDataJSON() as { item_id?: number; user_id?: string }
      if (body.item_id) {
        likeStore.push({ item_id: body.item_id, user_id: body.user_id ?? MOCK_USER_ID })
      }
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([body]),
      })
    }
    if (method === 'DELETE') {
      const url = route.request().url()
      const itemMatch = url.match(/item_id=eq\.(\d+)/)
      if (itemMatch) {
        const id = Number(itemMatch[1])
        likeStore = likeStore.filter((l) => !(l.item_id === id && l.user_id === MOCK_USER_ID))
      }
      return route.fulfill({ status: 204, body: '' })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.route('**/rest/v1/community_comments**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(comments),
      })
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })
  })
}

/**
 * Grava uso real do app em 4K para o walkthrough da landing.
 * CAPTURE_WALKTHROUGH=1 npm run capture:walkthrough-video
 */
test('record day-to-day walkthrough video', async ({ page }) => {
  test.setTimeout(240_000)
  test.skip(process.env.CAPTURE_WALKTHROUGH !== '1', 'Set CAPTURE_WALKTHROUGH=1')

  await page.setViewportSize({ width: W, height: H })
  await mockAuthenticatedApp(page)
  await seedMarianaPersona(page)
  await seedCommunityBoard(page)

  // Esconde cursor nativo — o player da landing desenha o ponteiro Apple
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = '*, *::before, *::after { cursor: none !important; }'
    document.documentElement.appendChild(style)
  })

  const wait = (ms: number) => page.waitForTimeout(ms)

  // —— Overview ——
  await page.goto('/app')
  await page.waitForLoadState('networkidle')
  await wait(2400)
  await page.mouse.wheel(0, 220)
  await wait(1000)
  await page.mouse.wheel(0, 260)
  await wait(1200)
  await page.mouse.wheel(0, -320)
  await wait(900)

  const quick = page.getByRole('button', { name: /Gasto rápido/i })
  if (await quick.count()) {
    await quick.first().hover()
    await wait(500)
    await quick.first().click()
    await wait(1000)
    await page.keyboard.press('Escape')
    await wait(700)
  }

  // —— Transações ——
  await page.getByRole('link', { name: /Transações/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2000)
  await page.mouse.wheel(0, 180)
  await wait(1100)

  // —— Cartões ——
  await page.getByRole('link', { name: /Cartões/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)
  await page.mouse.wheel(0, 240)
  await wait(1400)
  await page.mouse.wheel(0, 200)
  await wait(1100)

  // —— Metas ——
  await page.getByRole('link', { name: /Metas/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)
  await page.mouse.wheel(0, 160)
  await wait(1400)

  // —— Investimentos ——
  await page.getByRole('link', { name: /Investimentos/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2400)
  await page.mouse.wheel(0, 220)
  await wait(1600)

  // —— Assistente ——
  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(1000)

  await page.getByRole('button', { name: 'Assistente de gastos' }).click()
  await wait(1000)

  const later = page.getByRole('button', { name: /Agora não|Entendi/i })
  if (await later.count()) {
    await later.first().click().catch(() => undefined)
    await wait(450)
  }

  const input = page.getByRole('textbox').last()
  await input.click()
  await wait(350)
  await input.pressSequentially('Gastei 45 reais no mercado', { delay: 52 })
  await wait(800)
  await page.keyboard.press('Enter')
  await wait(2400)

  const closeAssist = page.getByRole('button', { name: /Fechar/i })
  if (await closeAssist.count()) await closeAssist.first().click().catch(() => undefined)
  await wait(900)

  // —— Comunidade (funcionando: board + like + nova sugestão) ——
  await page.getByRole('link', { name: /Comunidade/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)

  // Percorre colunas / cards
  await page.getByText('Integração Open Finance').first().hover()
  await wait(900)

  const likeBtn = page.getByRole('button', { name: /♡|♥/ }).first()
  if (await likeBtn.count()) {
    await likeBtn.click()
    await wait(1000)
  }

  await page.getByText('Exportar mês em PDF').first().hover()
  await wait(900)
  await page.getByText('Alertas de vencimento').first().hover()
  await wait(1000)
  await page.getByText('Assistente Flux').first().hover()
  await wait(900)

  // Nova sugestão — fluxo completo
  await page.getByRole('button', { name: /Nova sugestão/i }).click()
  await wait(1100)
  const titleField = page.getByPlaceholder('Ex.: Modo escuro automático')
  await titleField.click()
  await titleField.pressSequentially('Modo casal no orçamento', { delay: 48 })
  await wait(500)
  const bodyField = page.getByPlaceholder('Como isso te ajudaria no dia a dia?')
  if (await bodyField.count()) {
    await bodyField.click()
    await bodyField.pressSequentially('Duas pessoas no mesmo orçamento, com metas compartilhadas.', {
      delay: 36,
    })
    await wait(600)
  }
  await page.getByRole('button', { name: /Publicar sugestão/i }).click()
  await wait(1800)

  await page.getByText('Modo casal no orçamento').first().hover().catch(() => undefined)
  await wait(1200)
  await page.mouse.wheel(0, 160)
  await wait(1400)

  // Encerramento
  await page.getByRole('link', { name: /Visão geral/i }).first().click()
  await page.waitForLoadState('networkidle')
  await wait(2200)
})
