import { useQuery } from '@tanstack/react-query'
import { fetchStockQuotes } from '@/data/marketSpark'
import { liveQuoteRefetchMs } from '@/lib/marketSession'

/** Cotações Yahoo via proxy; opcionalmente só os símbolos da categoria ativa. */
export function useStockQuotes(symbols?: string[], enabled = true) {
  const symbolsKey = symbols?.length ? symbols.join('|') : 'all'

  return useQuery({
    queryKey: ['market', 'stocks', symbolsKey],
    queryFn: () => fetchStockQuotes(symbols),
    enabled,
    refetchInterval: () => liveQuoteRefetchMs(),
    staleTime: 8_000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}
