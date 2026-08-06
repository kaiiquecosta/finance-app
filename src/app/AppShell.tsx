import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { usePlan, useFinanceData, useProfile } from '@/data/hooks'
import { useTheme } from '@/app/theme'
import { signOut } from '@/data/auth'
import { openBillingPortal } from '@/data/billing'
import { isPro, planLabel, trialDaysLeft } from '@/domain/plan'
import { UpgradeModal } from '@/features/billing/UpgradeModal'
import { AccountModal } from '@/features/account/AccountModal'
import { ProfileModal } from '@/features/profile/ProfileModal'
import { UserBadge } from '@/features/profile/UserBadge'
import { ReminderPopup } from '@/features/reminders/ReminderPopup'
import { useReminders } from '@/features/reminders/useReminders'
import { CommunityStatusPopup } from '@/features/community/CommunityStatusPopup'
import { useCommunityStatusAlerts } from '@/features/community/useCommunityStatusAlerts'
import { isDemoPersonaEnabled, DEMO_PERSONA_LABEL } from '@/demo/isDemoPersona'
import { NAV_ITEMS } from './navItems'
import styles from './AppShell.module.css'

export function AppShell() {
  const { user } = useAuth()
  const plan = usePlan(user?.id)
  const finance = useFinanceData(user?.id)
  const profileQuery = useProfile(user?.id)
  const { reminders, dismiss } = useReminders(finance.data)
  const { queue: communityAlerts, dismissHead: dismissCommunityAlert } =
    useCommunityStatusAlerts(user?.id)
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const profile = profileQuery.data
  const displayName =
    profile?.name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Você'
  const navPhoto =
    profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined) || null
  const navEmoji = profile?.emoji || '😊'
  const navColor = profile?.color || '#820ad1'

  const pro = isPro(plan.data)
  const label = planLabel(plan.data)

  const onBadgeClick = () => {
    if (label === 'PRO') void openBillingPortal().catch(() => setUpgradeOpen(true))
    else setUpgradeOpen(true)
  }

  return (
    <div className={`${styles.app} ${isDemoPersonaEnabled() ? styles.appDemo : ''}`}>
      <header className={styles.topnav}>
        <div className={styles.topnavStart}>
          <UserBadge
            name={displayName}
            emoji={navEmoji}
            photoUrl={navPhoto}
            accent={navColor}
            onClick={() => setProfileOpen(true)}
          />
          <div className={styles.brand}>
            <span className={styles.logoDot} />
            Flux
          </div>
        </div>

        <div className={styles.tabsScroll} aria-label="Abas do app">
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
        </div>

        <div className={styles.topnavEnd}>
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
        </div>
      </header>

      {isDemoPersonaEnabled() ? (
        <div className={styles.demoBanner} role="status">
          📋 Visualização com dados fictícios ({DEMO_PERSONA_LABEL}). Desative{' '}
          <code>VITE_DEMO_PERSONA</code> no <code>.env.local</code> para ver seus dados reais.
        </div>
      ) : null}

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
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        profile={profile}
        onOpenAccount={() => setAccountOpen(true)}
      />
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
      <ReminderPopup reminders={reminders} onDismiss={dismiss} />
      <CommunityStatusPopup queue={communityAlerts} onDismiss={dismissCommunityAlert} />
    </div>
  )
}
