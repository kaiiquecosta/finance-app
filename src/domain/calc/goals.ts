/**
 * Metas: depósito/retirada e progresso. Portado de `legacy/index.html`
 * (doDeposit). As operações são puras: retornam a meta atualizada e um rascunho
 * de transação (sem id — atribuído na camada de dados).
 */
import { ZERO, add, max, min, neg, sub, type Cents } from '@/domain/money'
import type { Goal, ISODate, Transaction } from '@/domain/entities'

export interface GoalOperation {
  goal: Goal
  transaction: Omit<Transaction, 'id'>
}

/** Depósito na meta: saldo sobe (limitado ao alvo) e gera um gasto na conta. */
export function applyGoalDeposit(
  goal: Goal,
  amount: Cents,
  date: ISODate,
  accountId: number | null = null,
): GoalOperation {
  const saved = min(add(goal.saved, amount), goal.target)
  return {
    goal: { ...goal, saved },
    transaction: { name: `🎯 Meta: ${goal.name}`, cat: 'outros', amt: neg(amount), date, accountId },
  }
}

/** Retirada da meta: saldo desce (mínimo 0) e gera uma receita na conta. */
export function applyGoalWithdraw(
  goal: Goal,
  amount: Cents,
  date: ISODate,
  accountId: number | null = null,
): GoalOperation {
  const saved = max(ZERO, sub(goal.saved, amount))
  return {
    goal: { ...goal, saved },
    transaction: { name: `🎯 Retirada meta: ${goal.name}`, cat: 'receita', amt: amount, date, accountId },
  }
}

/** Progresso da meta: percentual (0..100) e valor restante. */
export function goalProgress(goal: Goal): { pct: number; remaining: Cents } {
  const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0
  return { pct, remaining: max(ZERO, sub(goal.target, goal.saved)) }
}
