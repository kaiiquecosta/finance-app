/**
 * Mutations de transação (criar, editar, excluir) com invalidação do cache.
 * O id é gerado no cliente por compatibilidade com o schema legado (bigint).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toTransactionRow } from '@/data/mappers'
import { queryKeys } from '@/data/queryKeys'
import type { Transaction } from '@/domain/entities'

export type TransactionDraft = Omit<Transaction, 'id'> & { id?: number }

/** Id numérico único (compatível com o `bigint` gerado no cliente do legado). */
export function newId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}

export function useTransactionMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const save = useMutation({
    mutationFn: async (draft: TransactionDraft) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const tx: Transaction = { ...draft, id: draft.id ?? newId() }
      await upsertRows('transactions', [toTransactionRow(tx, userId)])
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('transactions', id)
    },
    onSuccess: invalidate,
  })

  return { save, remove }
}
