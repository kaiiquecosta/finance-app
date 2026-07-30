import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { applyTheme, useTheme } from '@/app/theme'
import { AppShell } from '@/app/AppShell'
import { Splash } from '@/app/Splash'
import { NATIVE_PENDING_PATH_KEY } from '@/app/nativeAuth'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { LandingPage } from '@/pages/LandingPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { InvestmentsPage } from '@/pages/InvestmentsPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { BillsPage } from '@/pages/BillsPage'
import { CardsPage } from '@/pages/CardsPage'
import { InstallmentsPage } from '@/pages/InstallmentsPage'

export function App() {
  const theme = useTheme((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const { session, loading } = useAuth()
  const navigate = useNavigate()

  // No nativo, um deep link de reset de senha guarda a rota pretendida
  // (nativeAuth.ts) antes de a sessão existir; assim que ela aparece, navega
  // para lá em vez de cair na Visão geral por padrão.
  useEffect(() => {
    if (!session) return
    const pendingPath = sessionStorage.getItem(NATIVE_PENDING_PATH_KEY)
    if (!pendingPath) return
    sessionStorage.removeItem(NATIVE_PENDING_PATH_KEY)
    navigate(pendingPath, { replace: true })
  }, [session, navigate])

  if (loading) return <Splash />

  return (
    <Routes>
      {/* Sempre disponíveis (logado ou não). */}
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/termos" element={<TermsPage />} />

      {session ? (
        <>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="transacoes" element={<TransactionsPage />} />
            <Route path="cartoes" element={<CardsPage />} />
            <Route path="parcelas" element={<InstallmentsPage />} />
            <Route path="assinaturas" element={<SubscriptionsPage />} />
            <Route path="contas" element={<BillsPage />} />
            <Route path="metas" element={<GoalsPage />} />
            <Route path="investimentos" element={<InvestmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/entrar" element={<AuthScreen />} />
          <Route path="/criar-conta" element={<AuthScreen initialStep="register" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  )
}
