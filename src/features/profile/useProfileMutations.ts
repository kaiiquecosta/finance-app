import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'
import { showSaveToast } from '@/lib/toast'
import type { Profile } from '@/domain/entities'

export function useProfileMutations(userId: string | undefined) {
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      if (!userId) throw new Error('Sessão expirada.')
      await updateProfile(userId, patch)
    },
    onMutate: async (patch) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId) })
      const prev = queryClient.getQueryData<Profile | null>(queryKeys.profile(userId))
      if (prev) {
        queryClient.setQueryData<Profile | null>(queryKeys.profile(userId), { ...prev, ...patch })
      }
      return { prev }
    },
    onError: (_err, _patch, ctx) => {
      if (userId && ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.profile(userId), ctx.prev)
      }
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
      showSaveToast('Perfil atualizado', 'var(--green)', 'Salvo', '✓')
    },
  })

  return { save }
}
