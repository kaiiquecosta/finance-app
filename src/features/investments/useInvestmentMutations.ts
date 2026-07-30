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
import { neg, type Cents } from '@/domain/money'
import { calcInvestment, planRescue, DEFAULT_RATES, type MarketRates } from '@/domain/calc/investment'
import { toISODate } from '@/domain/dates'
import type { Investment, Transaction } from '@/domain/entities'

export interface InvestmentDraft extends Omit<Investment, 'id'> {
  debitAccountId?: number | null
}

export interface RescueInput {
  investment: Investment
  amount: Cents
  accountId: number | null
  rates?: MarketRates
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

  /**
   * Resgate parcial ou total. Calcula o valor líquido atual (CDI/IPCA reais),
   * planeja o resgate (reduzindo o principal proporcionalmente se parcial) e
   * lança uma transação de crédito na conta de destino.
   */
  const rescue = useMutation({
    mutationFn: async ({ investment, amount, accountId, rates }: RescueInput) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const result = calcInvestment(
        {
          amount: investment.amount,
          type: investment.type,
          date: investment.date,
          pct: investment.pct,
          spread: investment.spread,
          yield: investment.yield,
        },
        new Date(),
        rates ?? DEFAULT_RATES,
      )
      const plan = planRescue(investment.amount, result.netAmount, amount)

      const tx: Transaction = {
        id: newId(),
        name: `💰 Resgate: ${investment.name}`,
        cat: 'receita',
        amt: plan.creditAmount,
        date: toISODate(new Date()),
        accountId,
        investmentId: investment.id,
        billId: null,
        incomeKey: null,
      }

      if (plan.isFull) {
        await deleteRow('investments', investment.id)
      } else {
        await upsertRows('investments', [
          toInvestmentRow({ ...investment, amount: plan.remainingAmount }, userId),
        ])
      }
      await upsertRows('transactions', [toTransactionRow(tx, userId)])
      return plan
    },
    onSuccess: invalidate,
  })

  return { add, remove, rescue }
}
