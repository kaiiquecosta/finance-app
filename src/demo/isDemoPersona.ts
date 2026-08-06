/** Quando true, o app carrega a persona fictícia Mariana em vez do Supabase (somente leitura). */
export function isDemoPersonaEnabled(): boolean {
  return import.meta.env.VITE_DEMO_PERSONA === 'true'
}

export const DEMO_PERSONA_LABEL = 'Mariana Costa (demo)'
