/**
 * Fábrica de mutations por entidade: grava (upsert) e remove, invalidando o
 * cache financeiro do usuário. Evita repetir o mesmo boilerplate por feature.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRow, upsertRows } from './api'
import { queryKeys } from './queryKeys'
import { newId } from './ids'

export { newId } from './ids'

export function useEntityMutations<TEntity extends { id: number }>(
  table: string,
  toRow: (entity: TEntity, userId: string) => object,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
  }

  const save = useMutation({
    mutationFn: async (draft: Omit<TEntity, 'id'> & { id?: number }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      const entity = { ...draft, id: draft.id ?? newId() } as TEntity
      await upsertRows(table, [toRow(entity, userId)])
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await deleteRow(table, id)
    },
    onSuccess: invalidate,
  })

  return { save, remove }
}
