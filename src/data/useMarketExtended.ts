import { useQuery } from '@tanstack/react-query'
import { fetchCryptoUsd, fetchExtendedQuotes, fetchMarketIndices } from './marketExtended'

export function useExtendedQuotes() {
  return useQuery({
    queryKey: ['market', 'quotes-extended'],
    queryFn: fetchExtendedQuotes,
    refetchInterval: 20_000,
    staleTime: 15_000,
  })
}

export function useMarketIndices() {
  return useQuery({
    queryKey: ['market', 'indices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

export function useCryptoUsd() {
  return useQuery({
    queryKey: ['market', 'crypto-usd'],
    queryFn: fetchCryptoUsd,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}
