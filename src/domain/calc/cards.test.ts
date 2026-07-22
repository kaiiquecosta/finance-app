import { describe, expect, it } from 'vitest'
import { reais, type Cents } from '@/domain/money'
import type { Card, CardBill } from '@/domain/entities'
import {
  availableLimit,
  billsForMonth,
  getInvoiceMonth,
  invoiceTotal,
  openInvoiceMonth,
  totalAvailableLimit,
} from './cards'

let seq = 0
function bill(date: string, amt: Cents, extra: Partial<CardBill> = {}): CardBill {
  return { id: ++seq, cardId: 1, description: 'compra', amt, date, pastPaid: false, recurring: false, ...extra }
}
function card(bills: CardBill[], extra: Partial<Card> = {}): Card {
  return {
    id: 1,
    name: 'Nubank',
    color: '#8b5cf6',
    limit: reais(1000),
    closeDay: 5,
    dueDay: 12,
    type: 'credito',
    bills,
    ...extra,
  }
}

// 15 de março de 2026 (data local).
const asOf = new Date(2026, 2, 15)

describe('billsForMonth / invoiceTotal', () => {
  const c = card([
    bill('2026-03-10', reais(200), { id: 101 }), // dia 10 > fechamento 5 → fatura de abril
    bill('2026-03-03', reais(50), { id: 102 }), //  dia 3 ≤ 5 → fatura de março
  ])
  it('atribui à fatura conforme o dia de fechamento', () => {
    expect(billsForMonth(c, 2, 2026).map((b) => b.id)).toEqual([102]) // março = índice 2
    expect(billsForMonth(c, 3, 2026).map((b) => b.id)).toEqual([101]) // abril = índice 3
  })
  it('soma o total da fatura', () => {
    expect(invoiceTotal(c, 3, 2026)).toBe(20000)
    expect(invoiceTotal(c, 2, 2026)).toBe(5000)
  })
})

describe('getInvoiceMonth', () => {
  it('desloca meses e vira o ano', () => {
    expect(getInvoiceMonth(0, asOf)).toEqual({ month: 2, year: 2026 })
    expect(getInvoiceMonth(-1, asOf)).toEqual({ month: 1, year: 2026 })
    expect(getInvoiceMonth(1, asOf)).toEqual({ month: 3, year: 2026 })
    expect(getInvoiceMonth(-3, asOf)).toEqual({ month: 11, year: 2025 })
  })
})

describe('availableLimit / totalAvailableLimit', () => {
  const c = card([bill('2026-03-10', reais(200))], { limit: reais(1000), closeDay: 5 })

  it('fatura aberta considera o dia de fechamento', () => {
    // asOf dia 15 > fechamento 5 → fatura aberta é abril
    expect(openInvoiceMonth(c, asOf)).toEqual({ month: 3, year: 2026 })
  })
  it('limite disponível = limite − fatura aberta', () => {
    expect(availableLimit(c, asOf)).toBe(80000) // 1000 − 200
  })
  it('soma o disponível de vários cartões', () => {
    expect(totalAvailableLimit([c], asOf)).toBe(80000)
  })
})
