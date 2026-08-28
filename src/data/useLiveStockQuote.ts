import { useQuery } from '@tanstack/react-query'
import { fetchStockQuotes } from '@/data/marketSpark'
import { liveQuoteRefetchMs } from '@/lib/marketSession'

/** Cotação de um único ativo com polling rápido (modal de detalhe). */
export function useLiveStockQuote(symbol: string | null) {
  return useQuery({
    queryKey: ['market', 'live', symbol],
    queryFn: async () => {
      if (!symbol) return null
      const rows = await fetchStockQuotes([symbol])
      return rows.find((q) => q.yahoo === symbol) ?? rows[0] ?? null
    },
    enabled: !!symbol,
    refetchInterval: () => liveQuoteRefetchMs(),
    staleTime: 4_000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}
