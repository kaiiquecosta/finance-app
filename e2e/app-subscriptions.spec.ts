import { expect, test } from '@playwright/test'
import { mockAuthenticatedApp, seedCards } from './helpers/mockAuthenticatedApp'

test.describe('Assinaturas — cartão', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApp(page)
    await seedCards(page)
  })

  test('modal permite escolher entre vários cartões', async ({ page }) => {
    await page.goto('/app/assinaturas')
    await page.getByRole('button', { name: /Nova/i }).click()

    const select = page.getByTestId('subscription-card-select')
    await expect(select).toBeVisible()
    await expect(select.locator('option')).toHaveCount(3) // vazio + 2 cartões

    await select.selectOption({ label: 'Itaú' })
    await expect(select).toHaveValue('1002')

    await select.selectOption({ label: 'Nubank' })
    await expect(select).toHaveValue('1001')

    await select.selectOption({ label: 'Sem cartão / débito em conta' })
    await expect(select).toHaveValue('')
  })
})
