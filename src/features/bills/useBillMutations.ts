/**
 * Mutations de contas fixas: criar/editar/excluir + marcar como paga/desfazer.
 * Pagar cria uma transação de débito (billId aponta para a conta fixa);
 * desfazer remove essa transação.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from '@/data/api'
import { toFixedBillRow, toTransactionRow } from '@/data/mappers'
import { newId } from '@/data/useEntityMutations'
import { queryKeys } from '@/data/queryKeys'
import { neg } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { iconFor } from '@/domain/categories'
import { showSaveToast } from '@/lib/toast'
import type { FixedBill, Transaction } from '@/domain/entities'

export interface SetPaidInput {
  bill: FixedBill
  paid: boolean
  accountId?: number | null
  existingTxId?: number | null
}

export function useBillMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const save = useMutation({
    mutationFn: async (draft: Omit<FixedBill, 'id'> & { id?: number }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const bill: FixedBill = { ...draft, id: draft.id ?? newId() }
      await upsertRows('fixed_bills', [toFixedBillRow(bill, userId)])
    },
    onSuccess: () => {
      invalidate()
      showSaveToast('Conta fixa salva', 'var(--green)', 'Salvo', '💾')
    },
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow('fixed_bills', id)
    },
    onSuccess: () => {
      invalidate()
      showSaveToast('Conta removida', 'var(--muted)', undefined, '🗑️')
    },
  })

  const setPaid = useMutation({
    mutationFn: async ({ bill, paid, accountId, existingTxId }: SetPaidInput) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      if (paid) {
        const date = toISODate(new Date())
        const updated: FixedBill = { ...bill, paid: true, paidAt: date, paidAmount: bill.amt }
        const tx: Transaction = {
          id: newId(),
          name: `${iconFor(bill.category)} ${bill.name}`,
          cat: bill.category || 'outros',
          amt: neg(bill.amt),
          date,
          accountId: accountId ?? null,
          investmentId: null,
          billId: bill.id,
          incomeKey: null,
        }
        await upsertRows('fixed_bills', [toFixedBillRow(updated, userId)])
        await upsertRows('transactions', [toTransactionRow(tx, userId)])
      } else {
        const updated: FixedBill = { ...bill, paid: false, paidAt: null, paidAmount: null }
        await upsertRows('fixed_bills', [toFixedBillRow(updated, userId)])
        if (existingTxId != null) await deleteRow('transactions', existingTxId)
      }
    },
    onSuccess: (_void, { paid, bill }) => {
      invalidate()
      showSaveToast(
        paid ? `${bill.name} marcada como paga` : 'Pagamento desfeito',
        paid ? 'var(--green)' : 'var(--amber)',
        paid ? '✓ Pago' : 'Desfeito',
        paid ? '✓' : '↩',
      )
    },
  })

  return { save, remove, setPaid }
}
