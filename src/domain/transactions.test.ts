import { describe, expect, it } from 'vitest'
import { isManualExpenseTransaction } from './transactions'
import { reais } from './money'
import type { Transaction } from './entities'

const tx = (partial: Partial<Transaction> & Pick<Transaction, 'id' | 'name' | 'cat' | 'amt' | 'date'>): Transaction =>
  partial as Transaction

describe('isManualExpenseTransaction', () => {
  it('permite editar débito manual', () => {
    expect(isManualExpenseTransaction(tx({ id: 1, name: 'Mercado', cat: 'mercado', amt: reais(-50), date: '2026-01-01' }))).toBe(true)
  })
  it('bloqueia receita e vínculos automáticos', () => {
    expect(isManualExpenseTransaction(tx({ id: 2, name: 'Salário', cat: 'receita', amt: reais(100), date: '2026-01-01' }))).toBe(false)
    expect(
      isManualExpenseTransaction(
        tx({ id: 3, name: 'Luz', cat: 'energia', amt: reais(-80), date: '2026-01-01', billId: 1 }),
      ),
    ).toBe(false)
    expect(
      isManualExpenseTransaction(
        tx({ id: 4, name: 'CDB', cat: 'investimento', amt: reais(-1000), date: '2026-01-01', investmentId: 2 }),
      ),
    ).toBe(false)
  })
})
