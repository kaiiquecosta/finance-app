import { expect, test } from '@playwright/test'

test.describe('Autenticação (fluxos públicos)', () => {
  test('login: campos obrigatórios impedem envio vazio', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    // Validação nativa do navegador (required) mantém o usuário na mesma tela.
    await expect(page).toHaveURL(/\/entrar/)
  })

  test('cadastro: acusa senhas diferentes', async ({ page }) => {
    await page.goto('/criar-conta')
    await page.getByPlaceholder('Seu nome').fill('Teste E2E')
    await page.getByPlaceholder('voce@email.com').fill('teste-e2e@example.com')
    await page.getByPlaceholder('Mínimo 6 caracteres').fill('senha123')
    await page.getByPlaceholder('Repita a senha').fill('outrasenha')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()
  })

  test('alterna entre login e cadastro sem recarregar a página', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('"Esqueci minha senha" mostra o formulário de recuperação', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible()
  })

  test('mostrar/ocultar senha alterna o tipo do campo', async ({ page }) => {
    await page.goto('/entrar')
    const senha = page.getByPlaceholder('Sua senha')
    await expect(senha).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(senha).toHaveAttribute('type', 'text')
  })

  test('rota protegida sem sessão redireciona para a landing', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL('http://localhost:5173/')
  })
})
