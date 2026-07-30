/**
 * Tema dark/light. Aplica `data-theme` no <html> e persiste em localStorage
 * (mesma chave do legado: `finance_theme`).
 */
import { create } from 'zustand'

export type Theme = 'dark' | 'light'
const STORAGE_KEY = 'finance_theme'

function initialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'dark'
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
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
