import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCommunityComment,
  createCommunityItem,
  deleteCommunityItem,
  fetchCommunityBoard,
  fetchCommunityComments,
  toggleCommunityLike,
  updateCommunityItem,
} from '@/data/communityApi'
import { queryKeys } from '@/data/queryKeys'
import { newId } from '@/data/useEntityMutations'
import type { CommunityItemStatus } from '@/domain/community'

export function useCommunityBoard(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.community(),
    queryFn: () => fetchCommunityBoard(userId),
    enabled: !!userId,
  })
}

export function useCommunityComments(itemId: number | null, open: boolean) {
  return useQuery({
    queryKey: queryKeys.communityComments(itemId ?? 0),
    queryFn: () => fetchCommunityComments(itemId!),
    enabled: open && itemId != null,
  })
}

export function useCommunityMutations(userId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: queryKeys.community() })
  const invalidateComments = (itemId: number) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.communityComments(itemId) })

  const createItem = useMutation({
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await createCommunityItem(userId, newId(), title, body)
    },
    onSuccess: invalidateBoard,
  })

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      title,
      body,
      status,
    }: {
      id: number
      title?: string
      body?: string
      status?: CommunityItemStatus
    }) => {
      await updateCommunityItem(id, { title, body, status })
    },
    onSuccess: (_, vars) => {
      invalidateBoard()
      invalidateComments(vars.id)
    },
  })

  const removeItem = useMutation({
    mutationFn: (id: number) => deleteCommunityItem(id),
    onSuccess: invalidateBoard,
  })

  const toggleLike = useMutation({
    mutationFn: async ({ itemId, liked }: { itemId: number; liked: boolean }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await toggleCommunityLike(itemId, userId, liked)
    },
    onSuccess: invalidateBoard,
  })

  const postComment = useMutation({
    mutationFn: async ({ itemId, body }: { itemId: number; body: string }) => {
      if (!userId) throw new Error('Sessão expirada. Entre novamente.')
      await addCommunityComment(itemId, userId, newId(), body)
    },
    onSuccess: (_, vars) => {
      invalidateBoard()
      invalidateComments(vars.itemId)
    },
  })

  return { createItem, updateItem, removeItem, toggleLike, postComment }
}
