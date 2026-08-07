import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/data/supabase'
import { queryKeys } from '@/data/queryKeys'

/** Realtime + invalidação do board quando alguém move/atualiza sugestões. */
export function useCommunityBoardSync(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.community() })
    }

    const channel = supabase
      .channel(`community-board-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_items' },
        () => invalidate(),
      )
      .subscribe()

    const onVisible = () => {
      if (document.visibilityState === 'visible') invalidate()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
