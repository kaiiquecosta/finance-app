import { describe, expect, it } from 'vitest'
import { reais, type Cents } from '@/domain/money'
import type { Card, CardBill } from '@/domain/entities'
import {
  availableLimit,
  billsForMonth,
  getInvoiceMonth,
  invoiceMonthForPurchase,
  invoicePaymentDue,
  invoiceTotal,
  openInvoiceMonth,
  totalAvailableLimit,
  upcomingCardInvoices,
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

describe('billsForMonth — lançamentos recorrentes (assinatura no cartão)', () => {
  // closeDay=5 (padrão do helper `card()`); dia 10 > 5 → fatura de origem é fevereiro/2026.
  const c = card([
    bill('2026-01-10', reais(30), { id: 201, recurring: true, description: 'Netflix' }),
  ])

  it('repete todo mês a partir da fatura original', () => {
    expect(billsForMonth(c, 1, 2026).map((b) => b.id)).toEqual([201]) // fev (fatura de origem)
    expect(billsForMonth(c, 2, 2026).map((b) => b.id)).toEqual([201]) // mar
    expect(billsForMonth(c, 5, 2026).map((b) => b.id)).toEqual([201]) // jun
    expect(billsForMonth(c, 0, 2027).map((b) => b.id)).toEqual([201]) // jan/2027
  })
  it('não aparece antes do mês de início', () => {
    expect(billsForMonth(c, 0, 2026)).toEqual([]) // jan/2026 (antes da fatura de origem)
    expect(billsForMonth(c, 11, 2025)).toEqual([]) // dez/2025
  })
  it('consome limite todo mês (invoiceTotal/availableLimit)', () => {
    expect(invoiceTotal(c, 5, 2026)).toBe(3000)
    expect(availableLimit(card([bill('2026-01-10', reais(30), { recurring: true })], { limit: reais(1000) }), new Date(2026, 5, 15))).toBe(97000)
  })
  it('não-recorrente continua pontual (sem regressão)', () => {
    const mixed = card([
      bill('2026-01-10', reais(30), { id: 301, recurring: true }),
      bill('2026-01-10', reais(50), { id: 302, recurring: false }),
    ])
    expect(billsForMonth(mixed, 2, 2026).map((b) => b.id)).toEqual([301]) // só a recorrente
  })
})

describe('upcomingCardInvoices', () => {
  it('lista faturas com saldo > 0 nos próximos meses (incl. atual)', () => {
    const c = card(
      [
        bill('2026-03-10', reais(200), { id: 1 }), // > closeDay(5) → fatura abril
      ],
      { closeDay: 5, dueDay: 12 },
    )
    const list = upcomingCardInvoices([c], asOf, 3) // asOf = 15/mar/2026
    // meses varridos: mar, abr, mai — só abril tem saldo
    expect(list).toEqual([
      { id: 'cc-1-2026-3', cardId: 1, cardName: 'Nubank', color: '#8b5cf6', amt: 20000, dueDay: 12, month: 3, year: 2026 },
    ])
  })
  it('ignora meses sem fatura e cartões sem saldo', () => {
    const empty = card([], { id: 2 })
    expect(upcomingCardInvoices([empty], asOf, 3)).toEqual([])
  })
})

describe('invoiceMonthForPurchase / invoicePaymentDue', () => {
  it('compra após o fechamento vai para fatura do mês seguinte', () => {
    expect(invoiceMonthForPurchase('2026-03-10', 5)).toEqual({ month: 3, year: 2026 })
    expect(invoiceMonthForPurchase('2026-03-03', 5)).toEqual({ month: 2, year: 2026 })
    expect(invoiceMonthForPurchase('2026-03-05', 5)).toEqual({ month: 2, year: 2026 })
  })

  it('vencimento da fatura é no mês seguinte ao mês da fatura', () => {
    expect(invoicePaymentDue(2, 2026)).toEqual({ month: 3, year: 2026 })
    expect(invoicePaymentDue(11, 2026)).toEqual({ month: 0, year: 2027 })
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
