/**
 * Resolução de modo Open Finance (env + plano Pro).
 */
import type { Plan } from '@/domain/entities'
import { isPro } from '@/domain/plan'
import type { PluggyIntegrationMode } from './types'

/** Lê VITE_OPEN_FINANCE_MODE: off | personal | sandbox | commercial */
export function readIntegrationModeFromEnv(): PluggyIntegrationMode {
  const raw = (import.meta.env.VITE_OPEN_FINANCE_MODE as string | undefined)?.toLowerCase()
  if (raw === 'personal' || raw === 'sandbox' || raw === 'commercial') return raw
  return 'off'
}

/**
 * Uso pessoal (Meu Pluggy): permitido em dev mesmo no Free.
 * Sandbox/Commercial (widget para terceiros): exige Pro/trial quando flag STRICT estiver ativa.
 */
export function resolveEffectiveMode(
  envMode: PluggyIntegrationMode,
  plan: Plan | null | undefined,
  now: Date = new Date(),
): PluggyIntegrationMode {
  if (envMode === 'off') return 'off'
  if (envMode === 'personal') return 'personal'
  const strict = import.meta.env.VITE_OPEN_FINANCE_PRO_ONLY === 'true'
  if (!strict) return envMode
  return isPro(plan, now) ? envMode : 'off'
}

export function canAutoSyncOpenFinance(mode: PluggyIntegrationMode): boolean {
  return mode === 'personal' || mode === 'sandbox' || mode === 'commercial'
}
