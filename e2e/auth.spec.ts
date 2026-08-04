import { expect, test } from '@playwright/test'

/**
 * Fluxos públicos de autenticação. O caminho principal é sem senha (código de 6
 * dígitos por e-mail), então estes testes não disparam e-mail de verdade:
 * interceptam a rota /auth/v1/otp do Supabase, para não gastar o rate limit de
 * envio nem depender de caixa de entrada.
 */
const mockOtp = async (page: import('@playwright/test').Page) => {
  await page.route('**/auth/v1/otp**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )
}

test.describe('Autenticação (fluxos públicos)', () => {
  test('login: pede só e-mail, sem campo de senha', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
    await expect(page.getByPlaceholder('voce@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible()
    // o campo de senha saiu do caminho principal
    await expect(page.getByPlaceholder('Sua senha')).toHaveCount(0)
  })

  test('login: campo obrigatório impede envio vazio', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Enviar código' }).click()
    // Validação nativa do navegador (required) mantém o usuário na mesma tela.
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('login: e-mail válido leva ao passo de digitar o código', async ({ page }) => {
    await mockOtp(page)
    await page.goto('/entrar')
    await page.getByPlaceholder('voce@email.com').fill('teste-e2e@example.com')
    await page.getByRole('button', { name: 'Enviar código' }).click()

    await expect(page.getByRole('heading', { name: 'Digite o código' })).toBeVisible()
    await expect(page.getByText('teste-e2e@example.com')).toBeVisible()
    const codigo = page.getByPlaceholder('000000')
    await expect(codigo).toBeVisible()
    // "Entrar" só libera com os 6 dígitos
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled()
    await codigo.fill('123456')
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled()
  })

  test('código: o campo aceita só dígitos e no máximo 6', async ({ page }) => {
    await mockOtp(page)
    await page.goto('/entrar')
    await page.getByPlaceholder('voce@email.com').fill('teste-e2e@example.com')
    await page.getByRole('button', { name: 'Enviar código' }).click()

    const codigo = page.getByPlaceholder('000000')
    await codigo.pressSequentially('12a3b456789')
    await expect(codigo).toHaveValue('123456')
  })

  test('código: "Usar outro e-mail" volta para o login', async ({ page }) => {
    await mockOtp(page)
    await page.goto('/entrar')
    await page.getByPlaceholder('voce@email.com').fill('teste-e2e@example.com')
    await page.getByRole('button', { name: 'Enviar código' }).click()
    await page.getByRole('button', { name: 'Usar outro e-mail' }).click()
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('cadastro: pede nome e e-mail, sem senha', async ({ page }) => {
    await page.goto('/criar-conta')
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
    await expect(page.getByPlaceholder('Seu nome')).toBeVisible()
    await expect(page.getByPlaceholder('voce@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible()
    await expect(page.getByPlaceholder('Mínimo 6 caracteres')).toHaveCount(0)
  })

  test('alterna entre login e cadastro sem recarregar a página', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('saída de emergência: "Entrar com senha" abre o fluxo antigo', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Entrar com senha' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar com senha' })).toBeVisible()
    await expect(page.getByPlaceholder('Sua senha')).toBeVisible()
  })

  test('mostrar/ocultar senha alterna o tipo do campo', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Entrar com senha' }).click()
    const senha = page.getByPlaceholder('Sua senha')
    await expect(senha).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(senha).toHaveAttribute('type', 'text')
  })

  test('"Esqueci minha senha" mostra o formulário de recuperação', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'Entrar com senha' }).click()
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible()
  })

  test('rota protegida sem sessão redireciona para a landing', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL('http://localhost:5173/')
  })
})
