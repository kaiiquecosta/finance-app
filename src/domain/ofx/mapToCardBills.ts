import { reais, type Cents } from '@/domain/money'
import { newId } from '@/data/ids'
import type { CardBill } from '@/domain/entities'
import type { OfxTransaction } from './types'

function purchaseAmount(txn: OfxTransaction): Cents {
  return reais(Math.abs(txn.amount))
}

function purchaseDescription(txn: OfxTransaction): string {
  const text = (txn.memo || txn.name || 'Compra').trim()
  return text.slice(0, 200)
}

/** Evita reimportar FITIDs já gravados no cartão. */
export function filterDuplicatePurchases(
  purchases: OfxTransaction[],
  existing: CardBill[],
): { fresh: OfxTransaction[]; duplicates: OfxTransaction[] } {
  const known = new Set(
    existing.map((b) => b.externalId).filter((id): id is string => Boolean(id)),
  )

  const fresh: OfxTransaction[] = []
  const duplicates: OfxTransaction[] = []

  for (const txn of purchases) {
    if (known.has(txn.fitId)) duplicates.push(txn)
    else fresh.push(txn)
  }

  return { fresh, duplicates }
}

export function mapPurchasesToCardBills(cardId: number, purchases: OfxTransaction[]): CardBill[] {
  return purchases.map((txn) => ({
    id: newId(),
    cardId,
    description: purchaseDescription(txn),
    amt: purchaseAmount(txn),
    date: txn.date,
    pastPaid: false,
    recurring: false,
    externalId: txn.fitId,
  }))
}
