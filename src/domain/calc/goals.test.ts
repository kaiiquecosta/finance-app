import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import type { Goal } from '@/domain/entities'
import { applyGoalDeposit, applyGoalWithdraw, goalProgress } from './goals'

function goal(p: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    name: 'Viagem',
    target: reais(1000),
    saved: reais(100),
    icon: '🎯',
    color: '#22c55e',
    ...p,
  }
}

describe('applyGoalDeposit', () => {
  it('soma ao saldo e cria gasto', () => {
    const { goal: g, transaction } = applyGoalDeposit(goal(), reais(50), '2026-03-10', 3)
    expect(g.saved).toBe(15000)
    expect(transaction.amt).toBe(-5000)
    expect(transaction.cat).toBe('outros')
    expect(transaction.name).toBe('🎯 Meta: Viagem')
    expect(transaction.accountId).toBe(3)
  })
  it('nunca ultrapassa o alvo', () => {
    const { goal: g } = applyGoalDeposit(goal({ saved: reais(990) }), reais(50), '2026-03-10')
    expect(g.saved).toBe(100000) // limitado a R$1000
  })
})

describe('applyGoalWithdraw', () => {
  it('reduz o saldo e cria receita', () => {
    const { goal: g, transaction } = applyGoalWithdraw(goal({ saved: reais(300) }), reais(150), '2026-03-10')
    expect(g.saved).toBe(15000)
    expect(transaction.amt).toBe(15000)
    expect(transaction.cat).toBe('receita')
  })
  it('nunca fica negativo', () => {
    const { goal: g } = applyGoalWithdraw(goal({ saved: reais(100) }), reais(150), '2026-03-10')
    expect(g.saved).toBe(0)
  })
})

describe('goalProgress', () => {
  it('percentual e restante', () => {
    const p = goalProgress(goal({ saved: reais(250), target: reais(1000) }))
    expect(p.pct).toBe(25)
    expect(p.remaining).toBe(75000)
  })
  it('seguro para alvo zero', () => {
    expect(goalProgress(goal({ saved: reais(0), target: reais(0) })).pct).toBe(0)
  })
})
