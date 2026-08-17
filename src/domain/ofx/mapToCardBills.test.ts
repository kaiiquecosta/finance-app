import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import { filterDuplicatePurchases, mapPurchasesToCardBills } from './mapToCardBills'
import type { OfxTransaction } from './types'

describe('mapPurchasesToCardBills', () => {
  it('converte compras OFX em CardBill com externalId', () => {
    const txn: OfxTransaction = {
      fitId: 'fit-99',
      trnType: 'DEBIT',
      date: '2026-03-10',
      amount: -42.5,
      memo: 'LOJA',
      name: '',
    }
    const bills = mapPurchasesToCardBills(7, [txn])
    expect(bills).toHaveLength(1)
    expect(bills[0].cardId).toBe(7)
    expect(bills[0].amt).toBe(reais(42.5))
    expect(bills[0].externalId).toBe('fit-99')
  })

  it('filtra FITIDs já importados', () => {
    const txn: OfxTransaction = {
      fitId: 'fit-dup',
      trnType: 'DEBIT',
      date: '2026-03-10',
      amount: -10,
      memo: 'X',
      name: '',
    }
    const { fresh, duplicates } = filterDuplicatePurchases([txn], [
      {
        id: 1,
        cardId: 1,
        description: 'x',
        amt: reais(10),
        date: '2026-03-10',
        pastPaid: false,
        recurring: false,
        externalId: 'fit-dup',
      },
    ])
    expect(fresh).toHaveLength(0)
    expect(duplicates).toHaveLength(1)
  })
})
