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
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
      showSaveToast('Perfil atualizado', 'var(--green)', 'Salvo', '✓')
    },
  })

  return { save }
}
