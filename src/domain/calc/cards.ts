/**
 * Cartões de crédito: em qual fatura cada lançamento cai, total da fatura e
 * limite disponível. Portado de `legacy/index.html` (billsForMonth, getCardMonth,
 * renderCreditLimit). `asOf` é injetado para pureza/testes.
 */
import { sub, sum, type Cents } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import type { Card, CardBill } from '@/domain/entities'

/** Mês (0..11) e ano de uma fatura. */
export interface InvoiceMonth {
  month: number
  year: number
}

/** Mês/ano deslocado por `offset` a partir de `asOf`. */
export function getInvoiceMonth(offset: number, asOf: Date): InvoiceMonth {
  let m = asOf.getMonth() + offset
  let y = asOf.getFullYear()
  while (m < 0) {
    m += 12
    y--
  }
  while (m > 11) {
    m -= 12
    y++
  }
  return { month: m, year: y }
}

/** Fatura em que uma compra cai: se o dia > fechamento, vai para o mês seguinte. */
function billInvoiceMonth(dateStr: string, closeDay: number): InvoiceMonth {
  const d = parseISODate(dateStr)
  let fm = d.getMonth()
  let fy = d.getFullYear()
  if (d.getDate() > closeDay) {
    fm++
    if (fm > 11) {
      fm = 0
      fy++
    }
  }
  return { month: fm, year: fy }
}

/** Lançamentos do cartão que caem na fatura de (month, year). */
export function billsForMonth(card: Card, month: number, year: number): CardBill[] {
  return card.bills.filter((b) => {
    const im = billInvoiceMonth(b.date, card.closeDay)
    return im.month === month && im.year === year
  })
}

/** Total da fatura de (month, year). */
export function invoiceTotal(card: Card, month: number, year: number): Cents {
  return sum(billsForMonth(card, month, year).map((b) => b.amt))
}

/** Fatura aberta: mês em que novos gastos caem agora. */
export function openInvoiceMonth(card: Card, asOf: Date): InvoiceMonth {
  let m = asOf.getMonth()
  let y = asOf.getFullYear()
  if (asOf.getDate() > card.closeDay) {
    m++
    if (m > 11) {
      m = 0
      y++
    }
  }
  return { month: m, year: y }
}

/** Limite disponível de um cartão (limite − fatura aberta). */
export function availableLimit(card: Card, asOf: Date): Cents {
  const { month, year } = openInvoiceMonth(card, asOf)
  return sub(card.limit, invoiceTotal(card, month, year))
}

/** Limite total disponível somando todos os cartões. */
export function totalAvailableLimit(cards: Card[], asOf: Date): Cents {
  const limit = sum(cards.map((c) => c.limit))
  const open = sum(
    cards.map((c) => {
      const im = openInvoiceMonth(c, asOf)
      return invoiceTotal(c, im.month, im.year)
    }),
  )
  return sub(limit, open)
}
