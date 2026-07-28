/**
 * Mutations de cartões e lançamentos de fatura.
 * Cartões e card_bills são tabelas separadas; excluir o cartão remove as
 * faturas por cascade (FK on delete cascade no schema).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toCardBillRow, toCardRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import type { Card, CardBill } from '@/domain/entities'

export type CardDraft = Omit<Card, 'id' | 'bills'> & { id?: number }

export function useCardMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const saveCard = useMutation({
    mutationFn: async (draft: CardDraft) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const card: Card = { ...draft, id: draft.id ?? newId(), bills: [] }
      await upsertRows('cards', [toCardRow(card, userId)])
    },
    onSuccess: invalidate,
  })

  const removeCard = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('cards', id)
    },
    onSuccess: invalidate,
  })

  const addBills = useMutation({
    mutationFn: async (bills: CardBill[]) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await upsertRows(
        'card_bills',
        bills.map((b) => toCardBillRow(b, userId)),
      )
    },
    onSuccess: invalidate,
  })

  const removeBill = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('card_bills', id)
    },
    onSuccess: invalidate,
  })

  return { saveCard, removeCard, addBills, removeBill }
}
