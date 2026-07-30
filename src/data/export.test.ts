import { describe, expect, it } from 'vitest'
import { buildExportBundle } from './export'
import type { FinanceData } from './api'

const emptyData: FinanceData = {
  transactions: [],
  cards: [],
  installments: [],
  subscriptions: [],
  goals: [],
  bankAccounts: [],
  incomes: [],
  fixedBills: [],
  investments: [],
}

describe('buildExportBundle', () => {
  it('monta o pacote com metadados e os dados do usuário', () => {
    const now = new Date(2026, 2, 15)
    const bundle = buildExportBundle(
      'user@example.com',
      { id: 'u1', name: 'Kaique' },
      { userId: 'u1', plan: 'pro', status: 'active' },
      emptyData,
      now,
    )
    expect(bundle.app).toBe('Finance')
    expect(bundle.version).toBe(1)
    expect(bundle.account).toEqual({ email: 'user@example.com', name: 'Kaique' })
    expect(bundle.plan?.plan).toBe('pro')
    expect(bundle.data).toBe(emptyData)
    expect(bundle.exportedAt).toBe(now.toISOString())
  })

  it('lida com profile/plan ausentes', () => {
    const bundle = buildExportBundle('user@example.com', null, null, emptyData)
    expect(bundle.account.name).toBeNull()
    expect(bundle.plan).toBeNull()
  })
})
