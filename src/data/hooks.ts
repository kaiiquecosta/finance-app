/**
 * Hooks de dados (TanStack Query) + sessão de auth.
 * Substituem o padrão "arrays globais + autosave" do legado por cache reativo.
 */
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { getSession, onAuthChange } from './auth'
import { fetchFinanceData, fetchPlan, fetchProfile } from './api'
import { queryKeys } from './queryKeys'

export interface SessionState {
  session: Session | null
  user: User | null
  loading: boolean
}

/** Estado de autenticação reativo (sessão inicial + onAuthStateChange). */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getSession()
      .then((s) => {
        if (active) setSession(s)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const unsubscribe = onAuthChange((s) => setSession(s))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}

/** Todos os dados financeiros do usuário. */
export function useFinanceData(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.finance(userId ?? 'anon'),
    queryFn: () => fetchFinanceData(userId as string),
    enabled: Boolean(userId),
  })
}

export function usePlan(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.plan(userId ?? 'anon'),
    queryFn: () => fetchPlan(userId as string),
    enabled: Boolean(userId),
  })
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? 'anon'),
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  })
}

/**
 * Cria uma mutação que escreve no banco e invalida os dados financeiros do
 * usuário ao concluir (recarrega o cache). Optimistic updates entram na Fase 3.
 */
export function useFinanceMutation<TArgs>(
  writer: (args: TArgs) => Promise<void>,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: writer,
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.finance(userId) })
    },
  })
}
