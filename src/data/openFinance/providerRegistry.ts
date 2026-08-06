import type { Plan } from '@/domain/entities'
import {
  createManualFinancialProvider,
} from '@/data/openFinance/providers/manualProvider'
import { createPluggyFinancialProvider } from '@/data/openFinance/providers/pluggyProvider'
import type { FinancialDataProvider } from '@/domain/openFinance/provider'
import {
  readIntegrationModeFromEnv,
  resolveEffectiveMode,
} from '@/domain/openFinance/integrationMode'

/** Factory única — telas dependem disto, não da Pluggy diretamente. */
export function getFinancialDataProvider(plan: Plan | null | undefined): FinancialDataProvider {
  const envMode = readIntegrationModeFromEnv()
  const mode = resolveEffectiveMode(envMode, plan)
  if (mode === 'off') return createManualFinancialProvider('off')
  return createPluggyFinancialProvider(mode)
}

export type { PluggyIntegrationMode } from '@/domain/openFinance/types'
