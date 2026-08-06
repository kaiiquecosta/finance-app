import { useQuery } from '@tanstack/react-query'
import { fetchChartSeries, type ChartRange } from './marketChart'

/** Série histórica de um ativo; intraday atualiza mais rápido. */
export function useChartSeries(symbol: string | null, range: ChartRange) {
  const intraday = range === '1d' || range === '5d'
  return useQuery({
    queryKey: ['market', 'chart', symbol, range],
    queryFn: () => fetchChartSeries(symbol!, range),
    enabled: !!symbol,
    refetchInterval: intraday ? 60_000 : 5 * 60_000,
    staleTime: intraday ? 45_000 : 4 * 60_000,
    retry: 1,
  })
}

/** Série de 1 ano (diária) para indicadores e retornos por período. */
export function useYearSeries(symbol: string | null) {
  return useQuery({
    queryKey: ['market', 'chart', symbol, '1y-stats'],
    queryFn: () => fetchChartSeries(symbol!, '1y'),
    enabled: !!symbol,
    staleTime: 10 * 60_000,
    retry: 1,
  })
}
