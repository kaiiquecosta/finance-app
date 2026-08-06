import type { Page } from '@playwright/test'
import { marianaDemoRestRows } from '../../src/demo/marianaDemoRest'
import { MOCK_USER_ID } from './mockAuthenticatedApp'

export { MOCK_USER_ID }

/** Mock REST com a persona Mariana (contas, faturas, metas, etc.). */
export async function seedMarianaPersona(page: Page) {
  const rows = marianaDemoRestRows(MOCK_USER_ID)

  const tableRoutes: { table: string; body: unknown }[] = [
    { table: 'transactions', body: rows.transactions },
    { table: 'cards', body: rows.cards },
    { table: 'card_bills', body: rows.card_bills },
    { table: 'installments', body: rows.installments },
    { table: 'subscriptions', body: rows.subscriptions },
    { table: 'goals', body: rows.goals },
    { table: 'bank_accounts', body: rows.bank_accounts },
    { table: 'incomes', body: rows.incomes },
    { table: 'fixed_bills', body: rows.fixed_bills },
    { table: 'investments', body: rows.investments },
  ]

  for (const { table, body } of tableRoutes) {
    await page.route(`**/rest/v1/${table}**`, (route) => {
      if (route.request().method() !== 'GET') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })
  }

  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: MOCK_USER_ID,
          name: 'Mariana Costa',
          phone: '(11) 98765-4321',
          avatar_url: null,
          color: '#8b5cf6',
          emoji: '👩‍💻',
          is_admin: false,
        },
      ]),
    }),
  )
}
