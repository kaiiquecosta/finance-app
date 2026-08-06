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

/** Compara (year,month) cronologicamente: negativo se a < b, positivo se a > b. */
function compareYm(aYear: number, aMonth: number, bYear: number, bMonth: number): number {
  return (aYear * 12 + aMonth) - (bYear * 12 + bMonth)
}

/**
 * Lançamentos do cartão que caem na fatura de (month, year).
 *
 * Lançamentos `recurring:true` (assinaturas vinculadas ao cartão) repetem
 * todo mês a partir da fatura original, indefinidamente — não são N linhas
 * no banco, é 1 linha projetada para frente. Consomem limite todo mês até
 * serem removidas (ver `useSubscriptionMutations`).
 */
export function billsForMonth(card: Card, month: number, year: number): CardBill[] {
  return card.bills.filter((b) => {
    const im = billInvoiceMonth(b.date, card.closeDay)
    if (b.recurring) return compareYm(year, month, im.year, im.month) >= 0
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

/** Diferencia cartões com o mesmo nome (ex.: dois Nubank). */
export function cardDisplayName(card: Card, allCards: Card[]): string {
  const norm = card.name.trim().toLowerCase()
  const dupes = allCards.filter((c) => c.name.trim().toLowerCase() === norm)
  if (dupes.length <= 1) return card.name
  return `${card.name} · fecha dia ${card.closeDay}`
}

/** Fatura de cartão com valor a vencer, para unificar com contas fixas. */
export interface UpcomingCardInvoice {
  id: string
  cardId: number
  cardName: string
  color: string
  amt: Cents
  dueDay: number
  month: number
  year: number
}

/**
 * Faturas de cartão com saldo devedor nos próximos `monthsAhead` meses
 * (incluindo o atual). Portado de `legacy/index.html` (`renderBills`, faturas
 * "virtuais") para dar, na tela de Contas, a visão unificada "tudo que vence
 * este mês" — contas fixas reais + fatura do cartão.
 */
export function upcomingCardInvoices(
  cards: Card[],
  asOf: Date,
  monthsAhead = 3,
): UpcomingCardInvoice[] {
  const out: UpcomingCardInvoice[] = []
  for (const card of cards) {
    for (let i = 0; i < monthsAhead; i++) {
      const { month, year } = getInvoiceMonth(i, asOf)
      const amt = invoiceTotal(card, month, year)
      if (amt > 0) {
        out.push({
          id: `cc-${card.id}-${year}-${month}`,
          cardId: card.id,
          cardName: cardDisplayName(card, cards),
          color: card.color,
          amt,
          dueDay: card.dueDay,
          month,
          year,
        })
      }
    }
  }
  return out
}
