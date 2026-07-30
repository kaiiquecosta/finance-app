import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSession, onAuthChange } from '@/data/auth'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, loading: true })

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

/** Assina a sessão do Supabase uma única vez e compartilha via contexto. */
export function SessionProvider({ children }: { children: ReactNode }) {
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

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
