import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { usePlan } from '@/data/hooks'
import { useTheme } from '@/app/theme'
import { signOut } from '@/data/auth'
import styles from './AppShell.module.css'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Visão geral', icon: '📊', end: true },
  { to: '/app/transacoes', label: 'Transações', icon: '💸' },
  { to: '/app/cartoes', label: 'Cartões', icon: '💳' },
  { to: '/app/parcelas', label: 'Parcelas', icon: '🔁' },
  { to: '/app/assinaturas', label: 'Assinaturas', icon: '🔄' },
  { to: '/app/contas', label: 'Contas', icon: '🏠' },
  { to: '/app/metas', label: 'Metas', icon: '🎯' },
  { to: '/app/investimentos', label: 'Investimentos', icon: '📈' },
]

export function AppShell() {
  const { user } = useAuth()
  const plan = usePlan(user?.id)
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)
  const isPro = plan.data?.plan === 'pro' || plan.data?.status === 'trialing'

  return (
    <div className={styles.app}>
      <header className={styles.topnav}>
        <div className={styles.brand}>
          <span className={styles.logoDot} />
          Finance
        </div>
        <nav className={styles.tabs}>
          {NAV_ITEMS.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
              }
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.spacer} />
        <span className={`${styles.plan} ${isPro ? styles.planPro : ''}`}>
          {isPro ? 'PRO' : 'FREE'}
        </span>
        <button className={styles.iconBtn} onClick={toggle} title="Alternar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className={styles.iconBtn} onClick={() => void signOut()} title="Sair">
          ⎋
        </button>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomnav}>
        {NAV_ITEMS.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              isActive ? `${styles.mtab} ${styles.mtabActive}` : styles.mtab
            }
          >
            <span className={styles.micon} aria-hidden>
              {n.icon}
            </span>
            <span className={styles.mlabel}>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
