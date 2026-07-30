import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { applyTheme, useTheme } from '@/app/theme'
import { AppShell } from '@/app/AppShell'
import { Splash } from '@/app/Splash'
import { NATIVE_PENDING_PATH_KEY } from '@/app/nativeAuth'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'

// Code-splitting: cada página só baixa quando o usuário navega até ela.
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const PrivacyPage = lazy(() =>
  import('@/pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() => import('@/pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))
const OverviewPage = lazy(() =>
  import('@/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
)
const TransactionsPage = lazy(() =>
  import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
)
const GoalsPage = lazy(() => import('@/pages/GoalsPage').then((m) => ({ default: m.GoalsPage })))
const InvestmentsPage = lazy(() =>
  import('@/pages/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage })),
)
const SubscriptionsPage = lazy(() =>
  import('@/pages/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })),
)
const BillsPage = lazy(() => import('@/pages/BillsPage').then((m) => ({ default: m.BillsPage })))
const CardsPage = lazy(() => import('@/pages/CardsPage').then((m) => ({ default: m.CardsPage })))
const InstallmentsPage = lazy(() =>
  import('@/pages/InstallmentsPage').then((m) => ({ default: m.InstallmentsPage })),
)

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
    <Suspense fallback={<Splash />}>
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
    </Suspense>
  )
}
