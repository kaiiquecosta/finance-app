import { describe, expect, it } from 'vitest'
import { reais, type Cents } from '@/domain/money'
import type { Card, CardBill, Installment } from '@/domain/entities'
import {
  cardIdFromInstallmentId,
  deriveInstallments,
  effectiveColor,
  installmentColor,
  installmentProgress,
  planAdvance,
  summarizeInstallments,
} from './installments'

let seq = 0
function bill(description: string, amt: Cents, pastPaid = false): CardBill {
  return { id: ++seq, cardId: 1, description, amt, date: '2026-01-10', pastPaid, recurring: false }
}
function card(bills: CardBill[]): Card {
  return {
    id: 1,
    name: 'Nubank',
    color: '#8b5cf6',
    limit: reais(5000),
    closeDay: 5,
    dueDay: 12,
    type: 'credito',
    bills,
  }
}

describe('deriveInstallments — a partir das faturas', () => {
  const c = card([
    bill('iPhone 15 (1/3)', reais(100), true),
    bill('iPhone 15 (2/3)', reais(100)),
    bill('iPhone 15 (3/3)', reais(100)),
  ])
  const list = deriveInstallments([c], [])

  it('agrupa por nome base, conta pagas e calcula total', () => {
    expect(list).toHaveLength(1)
    const i = list[0]
    expect(i.name).toBe('iPhone 15')
    expect(i.parcels).toBe(3)
    expect(i.paid).toBe(1)
    expect(i.parcelAmount).toBe(10000)
    expect(i.total).toBe(30000)
    expect(i.source).toBe('card')
    expect(i.cardName).toBe('Nubank')
  })

  it('progresso', () => {
    const p = installmentProgress(list[0])
    expect(p.remaining).toBe(2)
    expect(p.pct).toBeCloseTo(33.333, 2)
  })
})

describe('deriveInstallments — manuais e filtro de quitados', () => {
  const done: Installment = { id: 9, name: 'Sofá', total: reais(1200), parcels: 12, paid: 12, icon: '🛋️', color: '#000000' }
  const active: Installment = { id: 10, name: 'Notebook', total: reais(1200), parcels: 12, paid: 3, icon: '💻', color: '#000000' }
  const list = deriveInstallments([], [done, active])

  it('remove os quitados (paid >= parcels) e calcula a parcela', () => {
    expect(list.map((i) => i.name)).toEqual(['Notebook'])
    expect(list[0].parcelAmount).toBe(10000) // 120000 / 12
  })
})

describe('summarizeInstallments', () => {
  it('total devido e comprometimento mensal', () => {
    const c = card([
      bill('iPhone (1/3)', reais(100), true),
      bill('iPhone (2/3)', reais(100)),
      bill('iPhone (3/3)', reais(100)),
    ])
    const s = summarizeInstallments(deriveInstallments([c], []))
    expect(s.count).toBe(1)
    expect(s.monthly).toBe(10000)
    expect(s.totalRemaining).toBe(20000) // 30000 − 10000×1
  })
})

describe('planAdvance (adianto de parcelas)', () => {
  const asOf = new Date(2026, 2, 15)
  function pbill(description: string, month: number, pastPaid = false): CardBill {
    return {
      id: month,
      cardId: 1,
      description,
      amt: reais(100),
      date: `2026-0${month}-10`,
      pastPaid,
      recurring: false,
    }
  }
  const c: Card = {
    id: 1,
    name: 'Nubank',
    color: '#000000',
    limit: reais(5000),
    closeDay: 5,
    dueDay: 12,
    type: 'credito',
    bills: [
      pbill('iPhone (1/4)', 1, true),
      pbill('iPhone (2/4)', 2),
      pbill('iPhone (3/4)', 3),
      pbill('iPhone (4/4)', 4),
    ],
  }

  it('pula a parcela atual e antecipa as próximas, movendo-as para hoje', () => {
    const plan = planAdvance(c, 'iPhone', 4, 1, asOf)
    expect(plan.maxQty).toBe(2) // 3 em aberto, menos a atual
    expect(plan.billsToAdvance).toHaveLength(1)
    expect(plan.billsToAdvance[0].description).toBe('iPhone (3/4)')
    expect(plan.billsToAdvance[0].pastPaid).toBe(true)
    expect(plan.billsToAdvance[0].date).toBe('2026-03-15')
    expect(plan.freedAmount).toBe(reais(100))
  })

  it('limita a quantidade ao máximo disponível', () => {
    const plan = planAdvance(c, 'iPhone', 4, 9, asOf)
    expect(plan.billsToAdvance).toHaveLength(2)
    expect(plan.freedAmount).toBe(reais(200))
  })
})

describe('cardIdFromInstallmentId', () => {
  it('extrai o cardId de ids de cartão', () => {
    expect(cardIdFromInstallmentId('c1::iPhone::4')).toBe(1)
    expect(cardIdFromInstallmentId('c42::Notebook Dell::12')).toBe(42)
  })
  it('retorna null para parcelamentos manuais', () => {
    expect(cardIdFromInstallmentId('9')).toBeNull()
  })
})

describe('installmentColor / effectiveColor', () => {
  it('infere a cor pelo nome', () => {
    expect(installmentColor('iPhone 15')).toBe('#94a3b8') // tech
    expect(installmentColor('Camiseta Nike')).toBe('#ec4899') // moda
    expect(installmentColor('coisa aleatória')).toBe('#3b82f6') // default
  })
  it('usa cor personalizada quando != default', () => {
    expect(effectiveColor({ color: '#ff0000', name: 'iPhone' })).toBe('#ff0000')
    expect(effectiveColor({ color: '#3b82f6', name: 'iPhone' })).toBe('#94a3b8')
  })
})
