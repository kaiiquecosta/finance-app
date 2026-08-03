import { expect, test } from '@playwright/test'

test.describe('Landing page', () => {
  test('mostra o hero e os CTAs corretos', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /suas finanças/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Abrir conta Flux' }).first()).toHaveAttribute(
      'href',
      '/criar-conta',
    )
  })

  test('"Começar grátis" (nav) leva ao cadastro', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.nav')
    await nav.getByRole('link', { name: 'Começar grátis', exact: true }).click()
    await expect(page).toHaveURL(/\/criar-conta/)
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
  })

  test('"Entrar" (aparece ao rolar) leva ao login', async ({ page }) => {
    await page.goto('/')
    // Aguarda o chunk lazy da landing montar antes de rolar (senão o scroll
    // acontece num body ainda vazio, do fallback <Splash/> do Suspense).
    await expect(page.getByRole('heading', { name: /suas finanças/i })).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 400))
    const nav = page.locator('nav.nav')
    await expect(nav.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
    await nav.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('a troca de aba do mockup do app funciona', async ({ page }) => {
    await page.goto('/')
    const mock = page.locator('.mock')
    await mock.getByText('Cartões').click()
    await expect(mock.getByText('NUBANK VISA INFINITE')).toBeVisible()
  })

  test('o FAQ abre e fecha (acordeão)', async ({ page }) => {
    await page.goto('/')
    const question = page.getByText('Preciso de cartão de crédito para o trial?')
    await question.scrollIntoViewIfNeeded()
    await question.click()
    await expect(page.getByText('O trial de 30 dias é 100% gratuito')).toBeVisible()
  })

  test('rodapé linka para as páginas legais', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Privacidade' }).click()
    await expect(page).toHaveURL(/\/privacidade/)
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
  })
})
