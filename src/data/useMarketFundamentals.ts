import { useQuery } from '@tanstack/react-query'
import { fetchAssetFundamentals } from './marketFundamentals'
import type { AssetKind } from './stocksCatalog'

export function useAssetFundamentals(
  symbol: string | null,
  kind: AssetKind,
  currency: 'BRL' | 'USD',
) {
  return useQuery({
    queryKey: ['market', 'fundamentals', symbol, kind],
    queryFn: () => fetchAssetFundamentals(symbol!, kind, currency),
    enabled: !!symbol,
    staleTime: 10 * 60_000,
    retry: 1,
  })
}
