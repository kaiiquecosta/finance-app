/**
 * Mutations de investimentos. Ao aportar, cria o investimento E uma transação
 * de débito na conta escolhida (o dinheiro sai da conta para a aplicação),
 * espelhando o comportamento do legado.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toInvestmentRow, toTransactionRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import { neg } from '@/domain/money'
import type { Investment, Transaction } from '@/domain/entities'

export interface InvestmentDraft extends Omit<Investment, 'id'> {
  debitAccountId?: number | null
}

export function useInvestmentMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const add = useMutation({
    mutationFn: async (draft: InvestmentDraft) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const { debitAccountId, ...rest } = draft
      const investment: Investment = { ...rest, id: newId() }
      const tx: Transaction = {
        id: newId(),
        name: `📈 ${investment.name}`,
        cat: 'investimento',
        amt: neg(investment.amount),
        date: investment.date,
        accountId: debitAccountId ?? null,
        investmentId: investment.id,
        billId: null,
        incomeKey: null,
      }
      await upsertRows('investments', [toInvestmentRow(investment, userId)])
      await upsertRows('transactions', [toTransactionRow(tx, userId)])
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('investments', id)
    },
    onSuccess: invalidate,
  })

  return { add, remove }
}
