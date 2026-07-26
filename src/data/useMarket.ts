import { useQuery } from '@tanstack/react-query'
import { fetchQuotes, fetchRates } from './market'

/** Cotações de câmbio/cripto, atualizadas a cada 20s (sensação de "ao vivo"). */
export function useQuotes() {
  return useQuery({
    queryKey: ['market', 'quotes'],
    queryFn: fetchQuotes,
    refetchInterval: 20_000,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

/** Taxas de referência (CDI/IPCA/Selic), atualizadas a cada 6h (mudam pouco). */
export function useRates() {
  return useQuery({
    queryKey: ['market', 'rates'],
    queryFn: fetchRates,
    refetchInterval: 6 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
  })
}
