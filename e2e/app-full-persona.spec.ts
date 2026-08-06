import { expect, test } from '@playwright/test'
import { mockAuthenticatedApp } from './helpers/mockAuthenticatedApp'
import { seedMarianaPersona } from './helpers/seedMarianaPersona'

test.describe('Persona Mariana — app preenchido', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedApp(page)
    await seedMarianaPersona(page)
  })

  test('Visão geral mostra fatura, contas fixas, metas e investimentos', async ({ page }) => {
    await page.goto('/app')
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
    await expect(page.getByText('Fatura do cartão')).toBeVisible()
    await expect(page.getByText('Condomínio').first()).toBeVisible()
    await expect(page.getByText('Viagem Disney')).toBeVisible()
    await expect(page.getByText('CDB Sofisa')).toBeVisible()
  })

  test('Contas fixas lista moradia e condomínio', async ({ page }) => {
    await page.goto('/app/contas')
    await expect(page.getByText('Condomínio', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Aluguel')).toBeVisible()
  })

  test('Assinaturas lista serviços e cartões', async ({ page }) => {
    await page.goto('/app/assinaturas')
    await expect(page.getByText('Netflix')).toBeVisible()
    await expect(page.getByText('HBO Max')).toBeVisible()
    await expect(page.getByText('ativas')).toBeVisible()
    await expect(page.locator('.num-md').filter({ hasText: '6' }).first()).toBeVisible()
  })

  test('Cartões mostra limites dos dois cartões', async ({ page }) => {
    await page.goto('/app/cartoes')
    await expect(page.getByText('Nubank')).toBeVisible()
    await expect(page.getByText('Itaú Click')).toBeVisible()
  })

  test('Metas mostra progresso Disney', async ({ page }) => {
    await page.goto('/app/metas')
    await expect(page.getByText('Viagem Disney')).toBeVisible()
    await expect(page.getByText('Reserva de emergência')).toBeVisible()
  })

  test('Investimentos — carteira com CDB e FII', async ({ page }) => {
    await page.goto('/app/investimentos')
    await expect(page.getByRole('tab', { name: /Carteira/i })).toBeVisible()
    await page.getByRole('tab', { name: /Carteira/i }).click()
    await expect(page.getByText('CDB Sofisa')).toBeVisible()
    await expect(page.getByText(/MXRF11|Maxi Renda/i)).toBeVisible()
  })

  test('Parcelas lista iPhone e geladeira', async ({ page }) => {
    await page.goto('/app/parcelas')
    await expect(page.getByText(/iPhone 15/)).toBeVisible()
    await expect(page.getByText(/Geladeira/)).toBeVisible()
  })

  test('Transações do mês tem lançamentos', async ({ page }) => {
    await page.goto('/app/transacoes')
    await expect(page.getByText(/Supermercado|Salário|Condomínio/i).first()).toBeVisible()
  })
})
