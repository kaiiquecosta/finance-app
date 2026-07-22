import { useEffect } from 'react'
import { useSession } from '@/data/hooks'
import { applyTheme, useTheme } from '@/app/theme'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { AuthedHome } from '@/app/AuthedHome'
import { Splash } from '@/app/Splash'

export function App() {
  const theme = useTheme((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const { session, loading } = useSession()

  if (loading) return <Splash />
  return session ? <AuthedHome email={session.user.email ?? ''} /> : <AuthScreen />
}
