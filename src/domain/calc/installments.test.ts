import { describe, expect, it } from 'vitest'
import { reais, type Cents } from '@/domain/money'
import type { Card, CardBill, Installment } from '@/domain/entities'
import {
  deriveInstallments,
  effectiveColor,
  installmentColor,
  installmentProgress,
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
