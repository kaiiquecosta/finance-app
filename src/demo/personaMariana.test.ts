import { describe, expect, it } from 'vitest'
import { buildMarianaFinanceData } from '@/demo/personaMariana'
import { marianaDemoRestRows } from '@/demo/marianaDemoRest'

describe('persona Mariana', () => {
  it('monta dataset completo coerente', () => {
    const d = buildMarianaFinanceData()
    expect(d.bankAccounts.length).toBeGreaterThanOrEqual(3)
    expect(d.cards.length).toBe(2)
    expect(d.fixedBills.some((b) => b.name.includes('Condomínio'))).toBe(true)
    expect(d.subscriptions.length).toBeGreaterThanOrEqual(5)
    expect(d.transactions.length).toBeGreaterThanOrEqual(15)
    expect(d.goals.some((g) => g.name.includes('Disney'))).toBe(true)
    expect(d.investments.some((i) => i.ticker === 'MXRF11')).toBe(true)

    const billsOnCards = d.cards.reduce((n, c) => n + c.bills.length, 0)
    expect(billsOnCards).toBeGreaterThan(0)
  })

  it('gera linhas REST para seed/mock', () => {
    const rows = marianaDemoRestRows('00000000-0000-4000-8000-000000000099')
    expect(rows.card_bills.length).toBeGreaterThan(rows.cards.length)
    expect(rows.fixed_bills.every((b) => b.user_id.startsWith('00000000'))).toBe(true)
  })
})
