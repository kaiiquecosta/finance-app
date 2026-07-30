/**
 * Exportação de dados (LGPD, direito de portabilidade). Monta um pacote JSON
 * com tudo que o usuário cadastrou. `buildExportBundle` é pura/testável;
 * `downloadJson` é o único trecho que toca o DOM (Blob + <a download>).
 */
import type { Plan, Profile } from '@/domain/entities'
import type { FinanceData } from './api'

export interface ExportBundle {
  exportedAt: string
  app: 'Finance'
  version: 1
  account: {
    email: string
    name: string | null
  }
  plan: Plan | null
  data: FinanceData
}

export function buildExportBundle(
  email: string,
  profile: Profile | null | undefined,
  plan: Plan | null | undefined,
  data: FinanceData,
  now: Date = new Date(),
): ExportBundle {
  return {
    exportedAt: now.toISOString(),
    app: 'Finance',
    version: 1,
    account: { email, name: profile?.name ?? null },
    plan: plan ?? null,
    data,
  }
}

/** Dispara o download do bundle como arquivo .json no navegador. */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
