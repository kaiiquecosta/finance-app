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

  test('a troca de aba do mockup do app funciona', async ({ page }) => {
    await page.goto('/')
    const preview = page.locator('.lp-product')
    await preview.getByRole('button', { name: 'Investimentos' }).click()
    await expect(preview.getByText('P/VP')).toBeVisible()
    await preview.getByRole('button', { name: 'Transações' }).click()
    await expect(preview.getByText('Receitas em Agosto')).toBeVisible()
    await preview.getByRole('button', { name: 'Comunidade' }).click()
    await expect(preview.getByText('Roadmap aberto')).toBeVisible()
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
