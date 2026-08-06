import { useQuery } from '@tanstack/react-query'
import { fetchStockQuotes } from '@/data/marketSpark'

/** Cotações Yahoo via proxy; opcionalmente só os símbolos da categoria ativa. */
export function useStockQuotes(symbols?: string[]) {
  const symbolsKey = symbols?.length ? symbols.join('|') : 'all'

  return useQuery({
    queryKey: ['market', 'stocks', symbolsKey],
    queryFn: () => fetchStockQuotes(symbols),
    refetchInterval: 30_000,
    staleTime: 20_000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}
