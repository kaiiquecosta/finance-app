import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatBRL } from '@/domain/money'
import type { Reminder, ReminderKind, ReminderUrgency } from '@/domain/calc/reminders'
import styles from './ReminderPopup.module.css'

const KIND_ICON: Record<ReminderKind, string> = {
  bill: '🏠',
  subscription: '🔁',
  income: '💰',
  installment: '🏁',
  goal: '🎯',
}

const KIND_ROUTE: Record<ReminderKind, string> = {
  bill: '/app/contas',
  subscription: '/app/assinaturas',
  income: '/app',
  installment: '/app/parcelas',
  goal: '/app/metas',
}

const URGENCY_STYLE: Record<ReminderUrgency, string> = {
  urgent: styles.urgent,
  warn: styles.warn,
  normal: styles.normal,
  income: styles.income,
}

interface Props {
  reminders: Reminder[]
  onDismiss: (id: string) => void
}

/** Fila de lembretes (contas, assinaturas, rendas, parcelas, metas) um a um. */
export function ReminderPopup({ reminders, onDismiss }: Props) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()

  if (reminders.length === 0) return null
  const safeIndex = Math.min(index, reminders.length - 1)
  const reminder = reminders[safeIndex]

  const next = () => setIndex((i) => (i + 1) % reminders.length)
  const prev = () => setIndex((i) => (i - 1 + reminders.length) % reminders.length)

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${URGENCY_STYLE[reminder.urgency]}`}>
        <div className={styles.top}>
          <span className={styles.icon}>{KIND_ICON[reminder.kind]}</span>
          <div className={styles.text}>
            <span className={styles.title}>{reminder.title}</span>
            {reminder.amount != null && (
              <span className={styles.amount}>{formatBRL(reminder.amount)}</span>
            )}
          </div>
          <button
            className={styles.close}
            onClick={() => onDismiss(reminder.id)}
            aria-label="Dispensar"
          >
            ✕
          </button>
        </div>
        <div className={styles.actions}>
          {reminders.length > 1 && (
            <div className={styles.nav}>
              <button onClick={prev} aria-label="Anterior">
                ‹
              </button>
              <span className={styles.count}>
                {safeIndex + 1}/{reminders.length}
              </span>
              <button onClick={next} aria-label="Próximo">
                ›
              </button>
            </div>
          )}
          <button className={styles.cta} onClick={() => navigate(KIND_ROUTE[reminder.kind])}>
            Ver →
          </button>
        </div>
      </div>
    </div>
  )
}
