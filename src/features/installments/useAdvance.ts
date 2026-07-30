/**
 * Efetiva o adianto de parcelas: marca as faturas antecipadas como pagas
 * (movidas para hoje) e cria uma transação de débito com o valor liberado.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertRows } from '@/data/api'
import { toCardBillRow, toTransactionRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import { neg } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import type { AdvancePlan } from '@/domain/calc/installments'
import type { Transaction } from '@/domain/entities'

export interface AdvanceInput {
  plan: AdvancePlan
  accountId: number | null
  label: string
}

export function useAdvanceInstallment(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ plan, accountId, label }: AdvanceInput) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      if (plan.billsToAdvance.length === 0) return
      await upsertRows(
        'card_bills',
        plan.billsToAdvance.map((b) => toCardBillRow(b, userId)),
      )
      const tx: Transaction = {
        id: newId(),
        name: `⚡ Adianto: ${label}`,
        cat: 'cartão',
        amt: neg(plan.freedAmount),
        date: toISODate(new Date()),
        accountId: accountId ?? null,
        investmentId: null,
        billId: null,
        incomeKey: null,
      }
      await upsertRows('transactions', [toTransactionRow(tx, userId)])
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
    },
  })
}
