import { useCallback, useState } from 'react'
import { loadFavorites, saveFavorites } from './favorites'

/** Favoritos do investidor — estado compartilhado entre abas (Investidor, Favoritos, detalhe). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())

  const toggleFavorite = useCallback((yahoo: string) => {
    setFavorites((prev) => {
      const next = prev.includes(yahoo) ? prev.filter((s) => s !== yahoo) : [...prev, yahoo]
      saveFavorites(next)
      return next
    })
  }, [])

  return { favorites, toggleFavorite }
}
