import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
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

const CTA_COLOR: Record<ReminderUrgency, string> = {
  urgent: '#f87171',
  warn: '#f59e0b',
  normal: '#a78bfa',
  income: '#22c55e',
}

const URGENCY_CLASS: Record<ReminderUrgency, string> = {
  urgent: styles.urgent,
  warn: styles.warn,
  normal: styles.normal,
  income: styles.income,
}

interface Props {
  reminders: Reminder[]
  onDismiss: (id: string) => void
}

/** Fila de lembretes — popup centralizado (legado), um por vez. */
export function ReminderPopup({ reminders, onDismiss }: Props) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (reminders.length === 0) {
      setIndex(0)
      return
    }
    setIndex((i) => Math.min(i, reminders.length - 1))
  }, [reminders.length])

  useEffect(() => {
    if (reminders.length !== 1) return
    const t = window.setTimeout(() => onDismiss(reminders[0].id), 10_000)
    return () => window.clearTimeout(t)
  }, [reminders, onDismiss])

  if (reminders.length === 0) return null

  const safeIndex = Math.min(index, reminders.length - 1)
  const reminder = reminders[safeIndex]
  const ctaColor = reminder.labelColor ?? CTA_COLOR[reminder.urgency]

  /** Próximo = vi este lembrete; não mostrar de novo nesta entrada no app. */
  const goNext = () => {
    onDismiss(reminder.id)
  }

  const goPrev = () => {
    if (safeIndex > 0) setIndex(safeIndex - 1)
  }

  const dismissCurrent = () => {
    onDismiss(reminder.id)
  }

  /** Fechar no fim da fila: garante que nenhum item “pulado” volte a aparecer. */
  const finishQueue = () => {
    for (const r of reminders) onDismiss(r.id)
  }

  const node = (
    <div className={styles.wrap} role="dialog" aria-live="polite">
      <div
        className={`${styles.card} ${URGENCY_CLASS[reminder.urgency]}`}
        style={{ ['--rem-accent' as string]: ctaColor }}
      >
        <div className={styles.top}>
          <div className={styles.icon}>{reminder.icon ?? KIND_ICON[reminder.kind]}</div>
          <div className={styles.body}>
            {reminder.label && (
              <div className={styles.label} style={{ color: reminder.labelColor ?? ctaColor }}>
                {reminder.label}
              </div>
            )}
            <div className={styles.title}>{reminder.title}</div>
            {reminder.subtitle && <div className={styles.sub}>{reminder.subtitle}</div>}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={reminders.length > 1 ? finishQueue : dismissCurrent}
            aria-label="Dispensar"
          >
            ×
          </button>
        </div>
        <div className={styles.footer}>
          {reminders.length > 1 ? (
            <>
              {safeIndex > 0 ? (
                <button type="button" className={`${styles.action} ${styles.actionMuted}`} onClick={goPrev}>
                  ← Anterior
                </button>
              ) : (
                <span />
              )}
              <div className={styles.dots}>
                {reminders.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ''}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Lembrete ${i + 1}`}
                  />
                ))}
              </div>
              {safeIndex < reminders.length - 1 ? (
                <button type="button" className={`${styles.action} ${styles.actionMuted}`} onClick={goNext}>
                  Próximo →
                </button>
              ) : (
                <button type="button" className={`${styles.action} ${styles.actionMuted}`} onClick={finishQueue}>
                  Fechar
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.action}
                style={{ color: ctaColor }}
                onClick={() => navigate(KIND_ROUTE[reminder.kind])}
              >
                Ver →
              </button>
              <button type="button" className={`${styles.action} ${styles.actionMuted}`} onClick={dismissCurrent}>
                Fechar
              </button>
            </>
          )}
        </div>
        {reminders.length > 1 && (
          <div className={styles.counter} style={{ marginTop: 8, textAlign: 'center' }}>
            {safeIndex + 1} de {reminders.length}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
