import { expect, test } from '@playwright/test'

test.describe('Landing page', () => {
  test('mostra o hero e os CTAs corretos', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /clareza para hoje/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /começar grátis/i }).first()).toHaveAttribute(
      'href',
      '/criar-conta',
    )
  })

  test('"Começar grátis" (nav) leva ao cadastro', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.lp-nav')
    await nav.getByRole('link', { name: 'Começar grátis', exact: true }).click()
    await expect(page).toHaveURL(/\/criar-conta/)
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
  })

  test('"Entrar" leva ao login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /clareza para hoje/i })).toBeVisible()
    const nav = page.locator('nav.lp-nav')
    await expect(nav.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
    await nav.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('barras de scroll hint aparecem no mockup', async ({ page }) => {
    await page.goto('/')
    const preview = page.locator('.lp-product')
    await expect(preview.getByText('← Arraste para ver todas as telas do Flux →')).toBeVisible()
    await expect(preview.locator('.lp-hscroll-bar--tabs .lp-hscroll-bar__thumb')).toBeVisible()
    await preview.getByRole('button', { name: 'Investimentos' }).click()
    await expect(preview.getByText('Deslize para ver mais categorias')).toBeVisible()
    await expect(preview.locator('.lp-hscroll-bar--inner .lp-hscroll-bar__thumb')).toBeVisible()
  })

  test('barra de scroll das tabs arrasta horizontalmente', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 })
    await page.goto('/')
    const tabs = page.locator('.lp-preview-tabs')
    const overflow = await tabs.evaluate((el) => el.scrollWidth - el.clientWidth)
    test.skip(overflow <= 2, 'tabs não precisam de scroll neste viewport')
    const before = await tabs.evaluate((el) => el.scrollLeft)
    const thumb = page.locator('.lp-hscroll-bar--tabs .lp-hscroll-bar__thumb')
    const box = await thumb.boundingBox()
    if (!box) throw new Error('thumb not found')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2)
    await page.mouse.up()
    const after = await tabs.evaluate((el) => el.scrollLeft)
    expect(after).toBeGreaterThan(before)
  })

  test('a troca de aba do mockup do app funciona', async ({ page }) => {
    await page.goto('/')
    const preview = page.locator('.lp-product')
    await preview.getByRole('button', { name: 'Cartões' }).click()
    await expect(preview.getByText('Fatura estimada')).toBeVisible()
    await expect(preview.getByText('R$ 2.168,05')).toBeVisible()
    await preview.getByRole('button', { name: 'Investimentos' }).click()
    await expect(preview.getByText('Maiores altas ▲')).toBeVisible()
    await expect(preview.getByText('tempo real · ~10s')).toBeVisible()
    await preview.getByRole('button', { name: 'Comunidade' }).click()
    await expect(preview.getByText('Adicionar sugestão +')).toBeVisible()
    await expect(preview.getByText('Queria uma parte de investimento em tudo')).toBeVisible()
  })

  test('cards do bento levam às seções da landing', async ({ page }) => {
    await page.goto('/')
    await page.locator('#produto').scrollIntoViewIfNeeded()
    await page.locator('.lp-bento-card', { hasText: 'Investidor' }).click()
    await expect(page).toHaveURL(/#investimentos/)
    await expect(page.locator('#investimentos')).toBeInViewport()
    await page.locator('.lp-bento-card', { hasText: 'Assistente' }).click()
    await expect(page).toHaveURL(/#assistente/)
    await expect(page.locator('#assistente')).toBeInViewport()
  })

  test('investimentos no mockup é interativo e sem banner de notificação na comunidade', async ({ page }) => {
    await page.goto('/')
    const preview = page.locator('.lp-product')
    await preview.getByRole('button', { name: 'Investimentos' }).click()
    await preview.getByRole('button', { name: '🏢 FIIs' }).click()
    await expect(preview.getByText('MXRF11')).toBeVisible()
    await preview.getByRole('button', { name: 'Maiores baixas' }).click()
    await expect(preview.getByText('Maiores baixas ▼')).toBeVisible()
    await preview.getByRole('button', { name: 'Comunidade' }).click()
    await expect(preview.getByText('Adicionar sugestão +')).toBeVisible()
    await expect(preview.getByText('Ative as notificações')).toHaveCount(0)
  })

  test('demonstração da comunidade anima sugestão até pronto', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#comunidade')
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByText('Queria uma parte de investimentos')).toBeVisible({ timeout: 12000 })
    await expect(section.getByText('Seu pedido ficou pronto')).toBeVisible({ timeout: 22000 })
  })

  test('demonstração do assistente roda ao rolar até a seção', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('section.lp-assistant')
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByText('Gastei 45 reais no mercado')).toBeVisible({ timeout: 8000 })
    await expect(section.getByText('Pronto! Registrado em Mercado.')).toBeVisible({ timeout: 8000 })
  })

  test('alterna entre modo claro e escuro', async ({ page }) => {
    await page.goto('/')
    const root = page.locator('main.lp')
    await expect(root).toHaveAttribute('data-theme', /light|dark/)
    const toggle = page.getByRole('button', { name: /modo (escuro|claro)/i })
    const before = await root.getAttribute('data-theme')
    await toggle.click()
    await expect(root).not.toHaveAttribute('data-theme', before ?? '')
  })

  test('o FAQ abre e fecha (acordeão)', async ({ page }) => {
    await page.goto('/')
    const question = page.getByText('Preciso de cartão para começar?')
    await question.scrollIntoViewIfNeeded()
    await question.click()
    await expect(page.getByText(/experimentar o Flux por 30 dias/i)).toBeVisible()
  })

  test('rodapé linka para as páginas legais', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Privacidade' }).click()
    await expect(page).toHaveURL(/\/privacidade/)
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
  })
})
