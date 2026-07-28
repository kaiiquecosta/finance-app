import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { usePlan } from '@/data/hooks'
import { useTheme } from '@/app/theme'
import { signOut } from '@/data/auth'
import { openBillingPortal } from '@/data/billing'
import { isPro, planLabel, trialDaysLeft } from '@/domain/plan'
import { UpgradeModal } from '@/features/billing/UpgradeModal'
import { NAV_ITEMS } from './navItems'
import styles from './AppShell.module.css'

export function AppShell() {
  const { user } = useAuth()
  const plan = usePlan(user?.id)
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const pro = isPro(plan.data)
  const label = planLabel(plan.data)

  const onBadgeClick = () => {
    if (label === 'PRO') void openBillingPortal().catch(() => setUpgradeOpen(true))
    else setUpgradeOpen(true)
  }

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
        <button
          className={`${styles.plan} ${pro ? styles.planPro : ''}`}
          onClick={onBadgeClick}
          title={label === 'PRO' ? 'Gerenciar assinatura' : 'Assinar o Pro'}
        >
          {label}
        </button>
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

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        trialDaysLeft={trialDaysLeft(plan.data)}
      />
    </div>
  )
}
