/** Favoritos do Investidor persistidos em localStorage. */
const KEY = 'flux_investor_favorites'

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function saveFavorites(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage indisponível */
  }
}
