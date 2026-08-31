import { expect, test } from '@playwright/test'
import { mockAuthenticatedApp } from './helpers/mockAuthenticatedApp'

test.describe('Investidor — busca por categoria', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApp(page)
  })

  test('limpa o campo de busca ao mudar de Fundos imobiliários para ETFs', async ({ page }) => {
    await page.goto('/app/investimentos')
    await page.getByRole('tab', { name: /Investidor/i }).click()

    await page.getByTestId('investor-category-fiis').click()
    const search = page.getByTestId('investor-search-input')
    await search.fill('MXRF11')
    await expect(search).toHaveValue('MXRF11')

    await page.getByTestId('investor-category-etfs_us').click()
    await expect(search).toHaveValue('')
  })

  test('favorito persiste após recarregar a página', async ({ page }) => {
    await page.goto('/app/investimentos')
    await page.getByRole('tab', { name: /Investidor/i }).click()
    await page.getByTestId('investor-category-acoes_br').click()

    const star = page.locator('button[title="Favoritar"]').first()
    await expect(star).toBeVisible({ timeout: 15_000 })
    await star.click()
    await expect(page.locator('button[title="Remover dos favoritos"]').first()).toBeVisible()

    await page.reload()
    await page.getByRole('tab', { name: /Investidor/i }).click()
    await page.getByTestId('investor-category-acoes_br').click()

    await expect(page.locator('button[title="Remover dos favoritos"]').first()).toBeVisible()
  })
})
