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
    await preview.getByRole('button', { name: 'Investimentos' }).click()
    await expect(preview.getByText('Deslize para ver mais categorias')).toBeVisible()
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
