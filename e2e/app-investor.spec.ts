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

    await page.getByTestId('investor-category-etfs').click()
    await expect(search).toHaveValue('')
  })
})
