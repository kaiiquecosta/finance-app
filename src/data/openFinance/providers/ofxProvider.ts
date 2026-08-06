import type { FinancialDataProvider } from '@/domain/openFinance/provider'
import type { PluggyIntegrationMode, SyncTransactionsResult } from '@/domain/openFinance/types'

/**
 * Importação OFX/CSV/PDF — Fase Freemium (stub).
 * Implementar parser em `src/domain/openFinance/ofx/` sem acoplar à Pluggy.
 */
export function createOfxFinancialProvider(mode: PluggyIntegrationMode = 'off'): FinancialDataProvider {
  return {
    id: 'ofx',
    mode,
    async listExternalAccounts() {
      return []
    },
    async syncTransactions(): Promise<SyncTransactionsResult> {
      throw new Error('Importação OFX ainda não implementada. Use lançamentos manuais ou Pluggy (Meu Pluggy).')
    },
  }
}
