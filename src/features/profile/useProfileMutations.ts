/**
 * Mutations do perfil: nome/telefone e avatar (foto ou emoji).
 *
 * A foto é guardada como data URL base64 na própria coluna `avatar_url`
 * (mesmo esquema do legado — sem depender do Storage do Supabase), por isso
 * o limite de tamanho é baixo.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfileAvatar, updateProfileInfo } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'

/** Limite do legado: 500KB (a imagem vai inteira para dentro de uma coluna). */
export const MAX_AVATAR_BYTES = 512_000

export function useProfileMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
  }

  const saveInfo = useMutation({
    mutationFn: async (info: { name: string; phone: string | null }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await updateProfileInfo(userId, info)
    },
    onSuccess: invalidate,
  })

  const savePhoto = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo inválido. Use uma imagem (JPG, PNG, etc).')
      }
      if (file.size > MAX_AVATAR_BYTES) {
        throw new Error('Foto muito grande. Use uma imagem menor que 500KB.')
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
        reader.readAsDataURL(file)
      })
      await updateProfileAvatar(userId, { avatarUrl: dataUrl, emoji: null })
    },
    onSuccess: invalidate,
  })

  const saveEmoji = useMutation({
    mutationFn: async (emoji: string) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await updateProfileAvatar(userId, { avatarUrl: null, emoji })
    },
    onSuccess: invalidate,
  })

  return { saveInfo, savePhoto, saveEmoji }
}
