import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import type { FixedBill, Goal, Income, Subscription } from '@/domain/entities'
import type { DerivedInstallment } from './installments'
import { computeReminders, type ReminderState } from './reminders'

const asOf = new Date(2026, 2, 15) // 15 de março de 2026

function state(over: Partial<ReminderState>): ReminderState {
  return { fixedBills: [], subscriptions: [], incomes: [], installments: [], goals: [], ...over }
}
function fb(p: Partial<FixedBill> & { id: number; dueDay: number }): FixedBill {
  return { name: 'Conta', amt: reais(200), icon: '🏠', color: '#000', category: 'moradia', paid: false, ...p }
}
function income(p: Partial<Income> & { id: number; days: number[] }): Income {
  return { name: 'Salário', amt: reais(1000), freq: 'mensal', icon: '💵', color: '#000', accountId: null, received: [], auto: true, ...p }
}
function goal(p: Partial<Goal> & { id: number }): Goal {
  return { name: 'Meta', target: reais(1000), saved: reais(100), icon: '🎯', color: '#000', ...p }
}
function derived(p: Partial<DerivedInstallment> & { id: string; parcels: number; paid: number }): DerivedInstallment {
  return { name: 'iPhone', total: reais(300), parcelAmount: reais(100), icon: '💳', color: '#3b82f6', source: 'card', ...p }
}

describe('computeReminders — contas fixas', () => {
  const rs = computeReminders(
    state({
      fixedBills: [
        fb({ id: 1, dueDay: 18 }), // diff 3 → normal
        fb({ id: 2, dueDay: 15 }), // diff 0 → urgent
        fb({ id: 3, dueDay: 10 }), // diff -5 → fora
        fb({ id: 4, dueDay: 16, paid: true }), // pago → fora
      ],
    }),
    asOf,
  )
  it('filtra por janela e marca urgência', () => {
    const bills = rs.filter((r) => r.kind === 'bill')
    expect(bills.map((b) => b.refId).sort()).toEqual([1, 2])
    expect(bills.find((b) => b.refId === 2)?.urgency).toBe('urgent')
    expect(bills.find((b) => b.refId === 1)?.urgency).toBe('normal')
  })
})

describe('computeReminders — assinaturas e rendas', () => {
  it('assinatura em 0..2 dias', () => {
    const rs = computeReminders(
      state({ subscriptions: [{ id: 1, name: 'Netflix', amt: reais(30), day: 16, icon: '🎬', color: '#000' } as Subscription] }),
      asOf,
    )
    expect(rs.find((r) => r.kind === 'subscription')?.urgency).toBe('warn')
  })
  it('renda a receber, exceto se já recebida', () => {
    const pending = computeReminders(state({ incomes: [income({ id: 1, days: [16] })] }), asOf)
    expect(pending.some((r) => r.kind === 'income')).toBe(true)

    const received = computeReminders(
      state({ incomes: [income({ id: 1, days: [16], received: ['2026-03-16'] })] }),
      asOf,
    )
    expect(received.some((r) => r.kind === 'income')).toBe(false)
  })
})

describe('computeReminders — parcelas e metas', () => {
  it('última parcela', () => {
    const rs = computeReminders(
      state({ installments: [derived({ id: 'a', parcels: 3, paid: 2 }), derived({ id: 'b', parcels: 3, paid: 0 })] }),
      asOf,
    )
    const inst = rs.filter((r) => r.kind === 'installment')
    expect(inst.map((i) => i.refId)).toEqual(['a'])
  })
  it('prazo de meta (bug corrigido: usa deadline)', () => {
    const rs = computeReminders(
      state({
        goals: [
          goal({ id: 1, deadline: '2026-03-20' }), // 5 dias → warn
          goal({ id: 2, deadline: '2026-03-16' }), // 1 dia → urgent
          goal({ id: 3, deadline: '2026-03-30' }), // 15 dias → fora
          goal({ id: 4, deadline: '2026-03-18', saved: reais(1000) }), // concluída → fora
        ],
      }),
      asOf,
    )
    const goals = rs.filter((r) => r.kind === 'goal')
    expect(goals.map((g) => g.refId).sort()).toEqual([1, 2])
    expect(goals.find((g) => g.refId === 2)?.urgency).toBe('urgent')
  })
})
