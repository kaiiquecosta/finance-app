import type { FinancialDataProvider } from '@/domain/openFinance/provider'
import type {
  ExternalAccountSnapshot,
  PluggyIntegrationMode,
  SyncTransactionsResult,
} from '@/domain/openFinance/types'

/** Plano Free: lançamentos manuais, OFX/PDF (futuro) — sem chamadas Pluggy. */
export function createManualFinancialProvider(mode: PluggyIntegrationMode = 'off'): FinancialDataProvider {
  return {
    id: 'manual',
    mode,
    async listExternalAccounts(): Promise<ExternalAccountSnapshot[]> {
      return []
    },
    async syncTransactions(): Promise<SyncTransactionsResult> {
      return { imported: 0, skipped: 0, dateFrom: '', dateTo: null }
    },
  }
}
