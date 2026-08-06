/**
 * Contrato de provedor de dados financeiros externos.
 * Implementações: manual, OFX (futuro), Pluggy (personal/sandbox/commercial).
 */
import type {
  ExternalAccountSnapshot,
  OpenFinanceProviderId,
  PluggyIntegrationMode,
  RegisterConnectionInput,
  RegisterConnectionResult,
  SyncTransactionsResult,
} from './types'

export interface FinancialDataProvider {
  readonly id: OpenFinanceProviderId
  readonly mode: PluggyIntegrationMode

  /** Lista contas já sincronizadas / disponíveis no provedor. */
  listExternalAccounts(): Promise<ExternalAccountSnapshot[]>

  /** Registra conexão (ex.: Item ID Meu Pluggy). Opcional para manual/OFX. */
  registerConnection?(input: RegisterConnectionInput): Promise<RegisterConnectionResult>

  /** Puxa transações e persiste no backend (Edge Function + Supabase). */
  syncTransactions(opts?: {
    connectionId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<SyncTransactionsResult>

  /** Token para widget Pluggy Connect (somente modos sandbox/commercial). */
  createConnectToken?(): Promise<{ accessToken: string }>
}

export interface ProviderFactoryContext {
  integrationMode: PluggyIntegrationMode
  isPro: boolean
}

export type FinancialDataProviderFactory = (ctx: ProviderFactoryContext) => FinancialDataProvider
