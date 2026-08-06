import { allocate, type Cents } from '@/domain/money'
import { addMonthsToISODate } from '@/domain/dates'
import { invoiceMonthForPurchase } from '@/domain/calc/cards'
import { newId } from '@/data/useEntityMutations'
import type { CardBill } from '@/domain/entities'

/** Gera lançamentos (à vista ou parcelado) respeitando a data de cada parcela. */
export function buildCardPurchaseBills(
  cardId: number,
  desc: string,
  total: Cents,
  purchaseDate: string,
  parcels: number,
): CardBill[] {
  if (parcels <= 1) {
    return [
      {
        id: newId(),
        cardId,
        description: desc,
        amt: total,
        date: purchaseDate,
        pastPaid: false,
        recurring: false,
      },
    ]
  }
  const parts = allocate(total, parcels)
  return parts.map((amt, i) => ({
    id: newId() + i,
    cardId,
    description: `${desc} (${i + 1}/${parcels})`,
    amt,
    date: addMonthsToISODate(purchaseDate, i),
    pastPaid: false,
    recurring: false,
  }))
}

export type PurchaseInvoicePreviewLine = {
  label: string
  invoiceMonth: number
  invoiceYear: number
}

/** Prévia de em qual fatura cada parcela cai (UI do modal de lançamento). */
export function previewPurchaseInvoices(
  purchaseDate: string,
  closeDay: number,
  parcels: number,
  desc: string,
): PurchaseInvoicePreviewLine[] {
  const n = Math.max(1, parcels)
  if (n === 1) {
    const im = invoiceMonthForPurchase(purchaseDate, closeDay)
    return [{ label: desc, invoiceMonth: im.month, invoiceYear: im.year }]
  }
  return Array.from({ length: n }, (_, i) => {
    const date = addMonthsToISODate(purchaseDate, i)
    const im = invoiceMonthForPurchase(date, closeDay)
    return {
      label: `${desc} (${i + 1}/${n})`,
      invoiceMonth: im.month,
      invoiceYear: im.year,
    }
  })
}
