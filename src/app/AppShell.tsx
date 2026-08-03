import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { usePlan, useFinanceData, useProfile } from '@/data/hooks'
import { useTheme } from '@/app/theme'
import { openBillingPortal } from '@/data/billing'
import { isPro, planLabel, trialDaysLeft } from '@/domain/plan'
import { UpgradeModal } from '@/features/billing/UpgradeModal'
import { AccountModal } from '@/features/account/AccountModal'
import { ProfileModal } from '@/features/profile/ProfileModal'
import { ReminderPopup } from '@/features/reminders/ReminderPopup'
import { useReminders } from '@/features/reminders/useReminders'
import { NAV_ITEMS } from './navItems'
import styles from './AppShell.module.css'

export function AppShell() {
  const { user } = useAuth()
  const plan = usePlan(user?.id)
  const finance = useFinanceData(user?.id)
  const profile = useProfile(user?.id)
  const { reminders, dismiss } = useReminders(finance.data)
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const pro = isPro(plan.data)
  const label = planLabel(plan.data)

  const fullName =
    profile.data?.name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Você'
  const firstName = fullName.split(' ')[0]
  const avatarColor = profile.data?.color || '#22c55e'
  const avatarPhoto = profile.data?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined)
  const avatarEmoji = profile.data?.emoji

  const onBadgeClick = () => {
    if (label === 'PRO') void openBillingPortal().catch(() => setUpgradeOpen(true))
    else setUpgradeOpen(true)
  }

  return (
    <div className={styles.app}>
      <header className={styles.topnav}>
        <button
          className={styles.userBadge}
          onClick={() => setProfileOpen(true)}
          title="Ver perfil"
        >
          <span
            className={styles.avatar}
            style={avatarPhoto ? undefined : { background: avatarColor }}
          >
            {avatarPhoto ? (
              <img src={avatarPhoto} alt="" className={styles.avatarImg} />
            ) : (
              avatarEmoji || firstName[0]?.toUpperCase()
            )}
          </span>
          <span className={styles.userInfo}>
            <span className={styles.userName}>{firstName}</span>
            <span className={styles.userHint}>Ver perfil</span>
          </span>
        </button>
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
        <button className={styles.iconBtn} onClick={() => setAccountOpen(true)} title="Minha conta">
          ⚙️
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
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ReminderPopup reminders={reminders} onDismiss={dismiss} />
    </div>
  )
}
