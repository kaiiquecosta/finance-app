import { describe, expect, it } from 'vitest'
import { previewPurchaseInvoices } from '@/features/cards/buildCardPurchaseBills'

describe('previewPurchaseInvoices', () => {
  it('parcelas caem em faturas distintas conforme data e fechamento', () => {
    const lines = previewPurchaseInvoices('2026-03-10', 5, 2, 'TV')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatchObject({ invoiceMonth: 3, invoiceYear: 2026 })
    expect(lines[1]).toMatchObject({ invoiceMonth: 4, invoiceYear: 2026 })
  })

  it('à vista usa a data da compra', () => {
    const lines = previewPurchaseInvoices('2026-03-03', 5, 1, 'Mercado')
    expect(lines[0]).toMatchObject({ invoiceMonth: 2, invoiceYear: 2026 })
  })
})
