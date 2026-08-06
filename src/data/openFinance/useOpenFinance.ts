import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinancialDataProvider } from '@/data/openFinance/providerRegistry'
import { usePlan } from '@/data/hooks'
import { supabase } from '@/data/supabase'

export function useFinancialConnections() {
  return useQuery({
    queryKey: ['financial_connections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_connections').select('*')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useOpenFinanceProvider(userId: string | undefined) {
  const { data: plan } = usePlan(userId)
  return getFinancialDataProvider(plan ?? null)
}

export function useRegisterPluggyItem(userId: string | undefined) {
  const provider = useOpenFinanceProvider(userId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { pluggyItemId: string; mode?: 'personal' | 'sandbox' | 'commercial' }) => {
      if (!provider.registerConnection) throw new Error('Provedor não suporta registro de conexão.')
      return provider.registerConnection(input)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['financial_connections'] })
      void qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export function useSyncOpenFinance(userId: string | undefined) {
  const provider = useOpenFinanceProvider(userId)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opts?: { connectionId?: string; dateFrom?: string; dateTo?: string }) =>
      provider.syncTransactions(opts),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['finance'] })
      void qc.invalidateQueries({ queryKey: ['financial_connections'] })
    },
  })
}
