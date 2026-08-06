import { expect, test } from '@playwright/test'
import { mockAuthenticatedApp, seedFixedBills } from './helpers/mockAuthenticatedApp'

test.describe('Visão geral — ordem dos blocos', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApp(page)
  })

  test('Metas e Investimentos aparecem antes de Visão anual e Potencial', async ({ page }) => {
    await page.goto('/app')
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()

    const goalsBlock = page.getByTestId('overview-goals-investments')
    const annualBlock = page.getByTestId('overview-annual-potential')
    await expect(goalsBlock).toBeVisible()
    await expect(annualBlock).toBeVisible()

    const yGoals = await goalsBlock.boundingBox()
    const yAnnual = await annualBlock.boundingBox()
    expect(yGoals && yAnnual && yGoals.y < yAnnual.y).toBeTruthy()
  })

  test('Gastos previstos mostra só o próximo mês', async ({ page }) => {
    await seedFixedBills(page)
    await page.goto('/app')

    const block = page.getByTestId('overview-upcoming-bills')
    await expect(block).toBeVisible()
    await expect(block.getByText('Energia')).toBeVisible()
    await expect(block.getByText('Água')).toBeVisible()
    await expect(block.getByTestId('overview-upcoming-month')).toHaveCount(1)
  })
})
