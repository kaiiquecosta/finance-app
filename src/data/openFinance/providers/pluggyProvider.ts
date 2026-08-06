import { supabase } from '@/data/supabase'
import type { FinancialDataProvider } from '@/domain/openFinance/provider'
import type {
  ExternalAccountSnapshot,
  PluggyIntegrationMode,
  RegisterConnectionInput,
  RegisterConnectionResult,
  SyncTransactionsResult,
} from '@/domain/openFinance/types'

async function invoke<T>(name: string, body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} })
  if (error) throw new Error(error.message)
  const payload = data as T & { error?: string }
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(payload.error)
  }
  return payload
}

export function createPluggyFinancialProvider(mode: PluggyIntegrationMode): FinancialDataProvider {
  return {
    id: 'pluggy',
    mode,

    async listExternalAccounts(): Promise<ExternalAccountSnapshot[]> {
      const { data, error } = await supabase.from('financial_external_accounts').select('*')
      if (error) throw error
      return (data ?? []).map((r) => ({
        externalId: r.pluggy_account_id as string,
        displayName: r.display_name as string,
        kind: r.account_kind as string,
        subtype: r.account_subtype as string | null,
        balance: r.balance != null ? Number(r.balance) : null,
        creditLimit: r.credit_limit != null ? Number(r.credit_limit) : null,
        currency: (r.currency as string) ?? 'BRL',
        linkedBankAccountId: r.bank_account_id as number | null,
      }))
    },

    async registerConnection(input: RegisterConnectionInput): Promise<RegisterConnectionResult> {
      const res = await invoke<{ connection: Record<string, unknown> }>('pluggy-register-item', {
        pluggyItemId: input.pluggyItemId,
        mode: input.mode ?? mode,
      })
      const c = res.connection
      return {
        connectionId: c.id as string,
        connectorName: (c.connector_name as string) ?? null,
        status: c.status as string,
      }
    },

    async syncTransactions(opts): Promise<SyncTransactionsResult> {
      const res = await invoke<{
        transactionsImported: number
        transactionsSkipped: number
        dateFrom: string
        dateTo: string | null
      }>('pluggy-sync', {
        connectionId: opts?.connectionId,
        dateFrom: opts?.dateFrom,
        dateTo: opts?.dateTo,
      })
      return {
        imported: res.transactionsImported,
        skipped: res.transactionsSkipped,
        dateFrom: res.dateFrom,
        dateTo: res.dateTo,
      }
    },

    async createConnectToken() {
      const res = await invoke<{ accessToken: string }>('pluggy-connect-token', {})
      return { accessToken: res.accessToken }
    },
  }
}
