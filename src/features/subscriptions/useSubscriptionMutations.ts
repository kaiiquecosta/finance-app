/**
 * Mutations de assinatura. Quando vinculada a um cartão (`cardId`), também
 * mantém um lançamento recorrente (`recurring: true`) em `card_bills` — uma
 * única linha que `billsForMonth` projeta para todo mês (ver domain/calc/cards).
 * O `card_bills.id` é o MESMO id da assinatura (1:1), o que torna trivial
 * achar/atualizar/remover o lançamento vinculado sem coluna extra.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toCardBillRow, toSubscriptionRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import { toISODate } from '@/domain/dates'
import type { CardBill, Subscription } from '@/domain/entities'

/** Data-âncora "todo dia X" no mês atual, com o dia limitado ao fim do mês. */
function anchorDateForDay(day: number, now: Date): string {
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  return toISODate(new Date(y, m, Math.min(day, lastDay)))
}

export function useSubscriptionMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const save = useMutation({
    mutationFn: async (draft: Omit<Subscription, 'id'> & { id?: number }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const sub: Subscription = { ...draft, id: draft.id ?? newId() }
      await upsertRows('subscriptions', [toSubscriptionRow(sub, userId)])

      if (sub.cardId != null) {
        const bill: CardBill = {
          id: sub.id,
          cardId: sub.cardId,
          description: sub.name,
          amt: sub.amt,
          date: anchorDateForDay(sub.day, new Date()),
          pastPaid: false,
          recurring: true,
          externalId: null,
        }
        await upsertRows('card_bills', [toCardBillRow(bill, userId)])
      } else {
        // Sem cartão vinculado (ou desvinculado numa edição) — garante que não
        // sobre nenhum lançamento recorrente órfão com este id.
        await deleteRow('card_bills', sub.id)
      }
      return sub
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('subscriptions', id)
      // Remove o lançamento recorrente vinculado (se existir) — some de todas
      // as faturas futuras imediatamente, já que é uma única linha projetada.
      await deleteRow('card_bills', id)
    },
    onSuccess: invalidate,
  })

  return { save, remove }
}
