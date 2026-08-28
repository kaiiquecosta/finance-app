import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInvestorFavorites, saveInvestorFavorites } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'
import { loadFavorites, saveFavorites } from './favorites'

/**
 * Favoritos do Investidor — sincronizados na conta (Supabase) quando logado.
 * Offline / sem login: fallback em localStorage neste dispositivo.
 */
export function useFavorites(userId: string | undefined) {
  const queryClient = useQueryClient()
  const migratedRef = useRef(false)
  const [localFavorites, setLocalFavorites] = useState<string[]>(() => loadFavorites())

  const query = useQuery({
    queryKey: queryKeys.investorFavorites(userId ?? 'anon'),
    queryFn: () => fetchInvestorFavorites(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: (tickers: string[]) => saveInvestorFavorites(userId as string, tickers),
    onMutate: async (tickers) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey: queryKeys.investorFavorites(userId) })
      const prev = queryClient.getQueryData<string[]>(queryKeys.investorFavorites(userId))
      queryClient.setQueryData(queryKeys.investorFavorites(userId), tickers)
      return { prev }
    },
    onError: (_err, _tickers, ctx) => {
      if (userId && ctx?.prev) {
        queryClient.setQueryData(queryKeys.investorFavorites(userId), ctx.prev)
      }
    },
  })

  // Migra favoritos do localStorage para a conta (uma vez, se o servidor estiver vazio).
  useEffect(() => {
    if (!userId || !query.isSuccess || migratedRef.current) return
    migratedRef.current = true
    const server = query.data ?? []
    const local = loadFavorites()
    if (server.length === 0 && local.length > 0) {
      void saveInvestorFavorites(userId, local).then(() => {
        queryClient.setQueryData(queryKeys.investorFavorites(userId), local)
        saveFavorites([])
        setLocalFavorites([])
      })
    } else if (server.length > 0) {
      saveFavorites([])
      setLocalFavorites([])
    }
  }, [userId, query.isSuccess, query.data, queryClient])

  const favorites = userId ? (query.data ?? []) : localFavorites

  const toggleFavorite = useCallback(
    (yahoo: string) => {
      if (userId) {
        const current = queryClient.getQueryData<string[]>(queryKeys.investorFavorites(userId)) ?? []
        const next = current.includes(yahoo) ? current.filter((s) => s !== yahoo) : [...current, yahoo]
        queryClient.setQueryData(queryKeys.investorFavorites(userId), next)
        saveMutation.mutate(next)
        return
      }
      setLocalFavorites((prev) => {
        const next = prev.includes(yahoo) ? prev.filter((s) => s !== yahoo) : [...prev, yahoo]
        saveFavorites(next)
        return next
      })
    },
    [userId, queryClient, saveMutation],
  )

  return {
    favorites,
    toggleFavorite,
    isLoading: Boolean(userId && query.isLoading),
    isSaving: saveMutation.isPending,
  }
}
