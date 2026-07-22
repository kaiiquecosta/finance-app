import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { applyTheme, useTheme } from '@/app/theme'
import { AppShell } from '@/app/AppShell'
import { Splash } from '@/app/Splash'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { OverviewPage } from '@/pages/OverviewPage'
import {
  BillsPage,
  CardsPage,
  GoalsPage,
  InstallmentsPage,
  InvestmentsPage,
  SubscriptionsPage,
  TransactionsPage,
} from '@/pages/placeholders'

export function App() {
  const theme = useTheme((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const { session, loading } = useAuth()
  if (loading) return <Splash />

  return (
    <Routes>
      {/* Sempre disponível — destino do link de recuperação de senha. */}
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

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
        <Route path="*" element={<AuthScreen />} />
      )}
    </Routes>
  )
}
