import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

vi.mock('@/data/api', () => ({
  fetchInvestorFavorites: vi.fn(),
  saveInvestorFavorites: vi.fn(),
}))

import { fetchInvestorFavorites, saveInvestorFavorites } from '@/data/api'
import { useFavorites } from './useFavorites'
import { loadFavorites, saveFavorites } from './favorites'

function wrapper(client: QueryClient) {
  return function Wrap({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}

describe('useFavorites', () => {
  beforeEach(() => {
    vi.mocked(fetchInvestorFavorites).mockReset()
    vi.mocked(saveInvestorFavorites).mockReset()
    localStorage.clear()
  })

  it('usa localStorage sem userId', () => {
    saveFavorites(['ITUB4.SA'])
    const client = new QueryClient()
    const { result } = renderHook(() => useFavorites(undefined), { wrapper: wrapper(client) })
    expect(result.current.favorites).toEqual(['ITUB4.SA'])
  })

  it('sincroniza toggle com Supabase quando logado', async () => {
    vi.mocked(fetchInvestorFavorites).mockResolvedValue(['PETR4.SA'])
    vi.mocked(saveInvestorFavorites).mockResolvedValue()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useFavorites('user-1'), { wrapper: wrapper(client) })

    await waitFor(() => expect(result.current.favorites).toEqual(['PETR4.SA']))

    act(() => {
      result.current.toggleFavorite('VALE3.SA')
    })

    await waitFor(() => {
      expect(saveInvestorFavorites).toHaveBeenCalledWith('user-1', ['PETR4.SA', 'VALE3.SA'])
    })
    expect(result.current.favorites).toEqual(['PETR4.SA', 'VALE3.SA'])
  })
})
