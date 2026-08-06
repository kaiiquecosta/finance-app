import { useQuery } from '@tanstack/react-query'
import { fetchStockQuotes } from '@/data/marketSpark'

/** Cotações de ações (Yahoo via proxy), refresh ~30s. */
export function useStockQuotes() {
  return useQuery({
    queryKey: ['market', 'stocks'],
    queryFn: () => fetchStockQuotes(),
    refetchInterval: 30_000,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  })
}
