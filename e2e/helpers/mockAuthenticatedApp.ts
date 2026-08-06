import type { Page } from '@playwright/test'

const MOCK_USER_ID = 'e2e00000-0000-4000-8000-000000000001'

export { MOCK_USER_ID }

/** Sessão mínima + dados vazios para navegar em /app nos E2E. */
export async function mockAuthenticatedApp(page: Page) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? ''
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] ?? 'local'
  const storageKey = `sb-${ref}-auth-token`

  const session = {
    access_token: 'e2e-mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-mock-refresh',
    user: {
      id: MOCK_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@flux.test',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'E2E Flux' },
      created_at: new Date().toISOString(),
    },
  }

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    { key: storageKey, value: JSON.stringify(session) },
  )

  await page.route('**/auth/v1/user**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session.user),
    }),
  )

  await page.route('**/auth/v1/token**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    }),
  )

  const emptyList = '[]'
  const tables = [
    'transactions',
    'cards',
    'card_bills',
    'installments',
    'subscriptions',
    'goals',
    'bank_accounts',
    'incomes',
    'fixed_bills',
    'investments',
    'profiles',
    'plans',
  ]

  for (const table of tables) {
    await page.route(`**/rest/v1/${table}**`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: emptyList })
      }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    })
  }

  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: MOCK_USER_ID,
          name: 'E2E Flux',
          phone: null,
          avatar_url: null,
          color: '#22c55e',
          emoji: '😊',
          is_admin: false,
        },
      ]),
    }),
  )

  await page.route('**/rest/v1/plans*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          user_id: MOCK_USER_ID,
          plan: 'free',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 86400000 * 30).toISOString(),
        },
      ]),
    }),
  )

  await page.route('**/api/market/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }),
  )
}

export async function seedFixedBills(page: Page) {
  await page.route('**/rest/v1/fixed_bills**', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          user_id: MOCK_USER_ID,
          name: 'Energia',
          amt: 110,
          due_day: 10,
          icon: '🏠',
          color: '#3b82f6',
          category: 'Moradia',
          paid: false,
          paid_at: null,
          paid_amount: null,
        },
        {
          id: 2,
          user_id: MOCK_USER_ID,
          name: 'Água',
          amt: 88,
          due_day: 10,
          icon: '💧',
          color: '#3b82f6',
          category: 'Moradia',
          paid: false,
          paid_at: null,
          paid_amount: null,
        },
      ]),
    })
  })
}

export async function seedCards(page: Page) {
  await page.route('**/rest/v1/cards**', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1001,
          user_id: MOCK_USER_ID,
          name: 'Nubank',
          color: '#8b5cf6',
          card_limit: 5000,
          close_day: 10,
          due_day: 15,
          card_type: 'Crédito',
        },
        {
          id: 1002,
          user_id: MOCK_USER_ID,
          name: 'Itaú',
          color: '#f97316',
          card_limit: 8000,
          close_day: 5,
          due_day: 12,
          card_type: 'Crédito',
        },
      ]),
    })
  })
}
