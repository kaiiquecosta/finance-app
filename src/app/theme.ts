/**
 * Tema dark/light. Aplica `data-theme` no <html> e persiste em localStorage
 * (mesma chave do legado: `finance_theme`).
 *
 * O padrão é CLARO — quem nunca escolheu um tema entra no claro. Só um
 * `finance_theme = 'dark'` gravado leva ao escuro, então a preferência de quem
 * já escolheu continua valendo. A base do CSS acompanha (`:root` é o claro em
 * styles/tokens.css), o que evita flash de tema na primeira pintura.
 */
import { create } from 'zustand'

export type Theme = 'dark' | 'light'
const STORAGE_KEY = 'finance_theme'

/** Rótulo do botão de tema: anuncia para qual modo o clique leva (igual login e apps grandes). */
export function themeToggleLabel(theme: Theme): string {
  return theme === 'light' ? 'Modo escuro' : 'Modo claro'
}

function initialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'light'
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const useTheme = create<ThemeStore>()((set, get) => ({
  theme: initialTheme(),
  setTheme: (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
    set({ theme: t })
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
