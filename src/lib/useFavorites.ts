import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInvestorFavorites, saveInvestorFavorites } from '@/data/api'
import { queryKeys } from '@/data/queryKeys'
import { loadFavorites, saveFavorites } from './favorites'

function persistFavoritesLocal(list: string[]) {
  saveFavorites(list)
}

function mergeTickerLists(...lists: string[][]): string[] {
  return [...new Set(lists.flat())]
}

/**
 * Favoritos do Investidor — localStorage imediato + Supabase quando logado.
 */
export function useFavorites(userId: string | undefined) {
  const queryClient = useQueryClient()
  const bootstrappedRef = useRef(false)
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
      persistFavoritesLocal(tickers)
      setLocalFavorites(tickers)
      return { prev }
    },
    onError: (_err, _tickers, ctx) => {
      if (!userId) return
      const rollback = ctx?.prev ?? loadFavorites()
      queryClient.setQueryData(queryKeys.investorFavorites(userId), rollback)
      persistFavoritesLocal(rollback)
      setLocalFavorites(rollback)
    },
    onSuccess: (_data, tickers) => {
      if (!userId) return
      queryClient.setQueryData(queryKeys.investorFavorites(userId), tickers)
      persistFavoritesLocal(tickers)
      setLocalFavorites(tickers)
    },
  })

  // Primeira carga: une servidor + localStorage e garante persistência nos dois lados.
  useEffect(() => {
    if (!userId || !query.isSuccess || query.data === undefined || bootstrappedRef.current) return
    bootstrappedRef.current = true

    const server = query.data
    const local = loadFavorites()
    const merged = mergeTickerLists(server, local)

    queryClient.setQueryData(queryKeys.investorFavorites(userId), merged)
    persistFavoritesLocal(merged)
    setLocalFavorites(merged)

    const sameAsServer =
      merged.length === server.length && merged.every((ticker) => server.includes(ticker))
    if (!sameAsServer) {
      void saveInvestorFavorites(userId, merged)
    }
  }, [userId, query.isSuccess, query.data, queryClient])

  useEffect(() => {
    bootstrappedRef.current = false
  }, [userId])

  const favorites = userId ? (query.data ?? localFavorites) : localFavorites

  const resolveCurrent = useCallback((): string[] => {
    if (!userId) return loadFavorites()
    return (
      queryClient.getQueryData<string[]>(queryKeys.investorFavorites(userId)) ??
      query.data ??
      loadFavorites()
    )
  }, [userId, queryClient, query.data])

  const toggleFavorite = useCallback(
    (yahoo: string) => {
      const current = resolveCurrent()
      const next = current.includes(yahoo) ? current.filter((s) => s !== yahoo) : [...current, yahoo]

      persistFavoritesLocal(next)
      setLocalFavorites(next)

      if (userId) {
        queryClient.setQueryData(queryKeys.investorFavorites(userId), next)
        saveMutation.mutate(next)
      }
    },
    [userId, queryClient, saveMutation, resolveCurrent],
  )

  return {
    favorites,
    toggleFavorite,
    isLoading: Boolean(userId && query.isLoading && query.data === undefined),
    isSaving: saveMutation.isPending,
  }
}
