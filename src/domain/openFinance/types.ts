/**
 * Tipos compartilhados de Open Finance (independente do provedor).
 */

export type OpenFinanceProviderId = 'manual' | 'ofx' | 'pluggy'

/** Fase 1 = personal (Meu Pluggy); Fase 2 = sandbox/commercial (Connect widget). */
export type PluggyIntegrationMode = 'off' | 'personal' | 'sandbox' | 'commercial'

export interface ExternalAccountSnapshot {
  externalId: string
  displayName: string
  kind: 'BANK' | 'CREDIT' | string
  subtype?: string | null
  balance?: number | null
  creditLimit?: number | null
  currency?: string
  linkedBankAccountId?: number | null
}

export interface ExternalTransactionDraft {
  externalId: string
  description: string
  /** Valor com sinal (negativo = gasto), em reais decimais antes da borda Cents. */
  amountSigned: number
  date: string
  categorySlug: string
  externalAccountId: string
}

export interface SyncAccountsResult {
  accounts: ExternalAccountSnapshot[]
}

export interface SyncTransactionsResult {
  imported: number
  skipped: number
  dateFrom: string
  dateTo?: string | null
}

export interface RegisterConnectionInput {
  pluggyItemId: string
  mode?: PluggyIntegrationMode
}

export interface RegisterConnectionResult {
  connectionId: string
  connectorName?: string | null
  status: string
}
