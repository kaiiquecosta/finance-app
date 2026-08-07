/** Incremente quando mudar textos do assistente (força mensagem de boas-vindas nova). */
export const ASSISTANT_COPY_VERSION = 2

export const ASSISTANT_WELCOME =
  'Oi! Digite ou fale em português. Ex.: 10 reais coxinha · gastei 45 no uber · recebi 500'

export const ASSISTANT_SUBTITLE = 'Registre gastos e receitas'

const COPY_VERSION_KEY = 'flux_assistant_copy_v'

export function readStoredAssistantCopyVersion(): number {
  try {
    return Number(localStorage.getItem(COPY_VERSION_KEY) ?? 0)
  } catch {
    return 0
  }
}

export function markAssistantCopyVersion(): void {
  try {
    localStorage.setItem(COPY_VERSION_KEY, String(ASSISTANT_COPY_VERSION))
  } catch {
    /* ignore */
  }
}

export function shouldRefreshAssistantWelcome(): boolean {
  return readStoredAssistantCopyVersion() < ASSISTANT_COPY_VERSION
}
