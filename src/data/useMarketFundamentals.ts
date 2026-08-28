import { useQuery } from '@tanstack/react-query'
import { fetchAssetFundamentals } from './marketFundamentals'
import type { AssetKind, StockRegion } from './catalog/types'

export function useAssetFundamentals(
  symbol: string | null,
  kind: AssetKind,
  region: StockRegion,
  currency: 'BRL' | 'USD',
) {
  return useQuery({
    queryKey: ['market', 'fundamentals', symbol, kind, region],
    queryFn: () => fetchAssetFundamentals(symbol!, kind, region, currency),
    enabled: !!symbol,
    staleTime: 10 * 60_000,
    retry: 1,
  })
}
