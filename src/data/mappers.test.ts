import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import type { CardRow, FixedBillRow, IncomeRow, InvestmentRow, TransactionRow } from './types'
import {
  rowToCard,
  rowToFixedBill,
  rowToIncome,
  rowToInvestment,
  rowToTransaction,
  toCardRow,
  toTransactionRow,
} from './mappers'

describe('conversão de dinheiro (reais no banco → centavos no domínio)', () => {
  it('rowToTransaction converte amt para centavos', () => {
    const row: TransactionRow = {
      id: 1,
      user_id: 'u1',
      name: 'Netflix',
      cat: 'streaming',
      amt: 26.9,
      date: '2026-03-05',
      account_id: 3,
      investment_id: null,
      bill_id: null,
      income_key: null,
      is_new: false,
    }
    const t = rowToTransaction(row)
    expect(t.amt).toBe(2690)
    expect(t.accountId).toBe(3)
    expect(t.cat).toBe('streaming')
    expect(t.date).toBe('2026-03-05')
  })

  it('round-trip transaction preserva o valor', () => {
    const t = rowToTransaction({
      id: 9,
      user_id: 'u1',
      name: 'x',
      cat: 'outros',
      amt: 1234.56,
      date: '2026-01-01',
      account_id: null,
      investment_id: null,
      bill_id: null,
      income_key: null,
      is_new: null,
    })
    expect(t.amt).toBe(123456)
    const row = toTransactionRow(t, 'u1')
    expect(row.amt).toBe(1234.56)
    expect(row.user_id).toBe('u1')
  })
})

describe('rowToCard', () => {
  const base: CardRow = {
    id: 1,
    user_id: 'u1',
    name: 'Nubank',
    color: '#8b5cf6',
    card_limit: 5000,
    close_day: 5,
    due_day: 12,
    card_type: 'Crédito',
  }
  it('converte limite e normaliza o tipo', () => {
    expect(rowToCard(base).limit).toBe(500000)
    expect(rowToCard(base).type).toBe('credito')
    expect(rowToCard({ ...base, card_type: 'Débito' }).type).toBe('debito')
  })
  it('anexa as faturas recebidas', () => {
    const c = rowToCard(base, [
      { id: 1, cardId: 1, description: 'x', amt: reais(100), date: '2026-01-01', pastPaid: false, recurring: false },
    ])
    expect(c.bills).toHaveLength(1)
  })
  it('round-trip preserva o limite', () => {
    const row = toCardRow(rowToCard(base), 'u1')
    expect(row.card_limit).toBe(5000)
    expect(row.card_type).toBe('Crédito')
  })
})

describe('mappers com defaults/nulos', () => {
  it('fixed bill: paid_amount nulo → null; número → centavos', () => {
    const base: FixedBillRow = {
      id: 1, user_id: 'u1', name: 'Aluguel', amt: 1500, due_day: 10,
      icon: '🏠', color: '#000', category: 'moradia', paid: false, paid_at: null, paid_amount: null,
    }
    expect(rowToFixedBill(base).paidAmount).toBeNull()
    expect(rowToFixedBill(base).amt).toBe(150000)
    expect(rowToFixedBill({ ...base, paid_amount: 1500 }).paidAmount).toBe(150000)
  })

  it('income: days/received/auto com defaults', () => {
    const row: IncomeRow = {
      id: 1, user_id: 'u1', name: 'Salário', amt: 3000, freq: 'mensal',
      icon: '💵', color: '#000', account_id: null, days: null, received: null, auto: null,
    }
    const i = rowToIncome(row)
    expect(i.amt).toBe(300000)
    expect(i.days).toEqual([])
    expect(i.received).toEqual([])
    expect(i.auto).toBe(true)
  })

  it('investment: yield_pct → yield', () => {
    const row: InvestmentRow = {
      id: 1, user_id: 'u1', name: 'CDB', bank: 'Nubank', amount: 1000, date: '2026-01-01',
      inv_type: 'cdb', pct: 110, spread: 0, yield_pct: 0, ticker: null, account_id: null,
    }
    const inv = rowToInvestment(row)
    expect(inv.amount).toBe(100000)
    expect(inv.type).toBe('cdb')
    expect(inv.pct).toBe(110)
  })
})
