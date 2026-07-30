/**
 * Mutations de metas: criar/editar/excluir + depósito/retirada.
 * Depósito e retirada usam as operações puras do domínio (applyGoalDeposit/
 * applyGoalWithdraw), que ajustam o saldo da meta E geram a transação
 * correspondente — aqui persistimos os dois no Supabase.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toGoalRow, toTransactionRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import { applyGoalDeposit, applyGoalWithdraw } from '@/domain/calc/goals'
import type { Cents } from '@/domain/money'
import type { Goal, ISODate } from '@/domain/entities'

export interface GoalTransactInput {
  goal: Goal
  amount: Cents
  mode: 'add' | 'remove'
  date: ISODate
  accountId: number | null
}

export function useGoalMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const save = useMutation({
    mutationFn: async (draft: Omit<Goal, 'id'> & { id?: number }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const goal: Goal = { ...draft, id: draft.id ?? newId() }
      await upsertRows('goals', [toGoalRow(goal, userId)])
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('goals', id)
    },
    onSuccess: invalidate,
  })

  const transact = useMutation({
    mutationFn: async ({ goal, amount, mode, date, accountId }: GoalTransactInput) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const op =
        mode === 'add'
          ? applyGoalDeposit(goal, amount, date, accountId)
          : applyGoalWithdraw(goal, amount, date, accountId)
      const tx = { ...op.transaction, id: newId() }
      await upsertRows('goals', [toGoalRow(op.goal, userId)])
      await upsertRows('transactions', [toTransactionRow(tx, userId)])
    },
    onSuccess: invalidate,
  })

  return { save, remove, transact }
}
