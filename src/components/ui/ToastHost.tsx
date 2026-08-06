import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { registerToast, unregisterToast, type SaveToastOptions } from '@/lib/toast'
import styles from './Toast.module.css'

type ActiveToast = SaveToastOptions & { id: number }

export function ToastHost() {
  const [active, setActive] = useState<ActiveToast | null>(null)

  useEffect(() => {
    registerToast((opts) => setActive({ ...opts, id: Date.now() }))
    return () => unregisterToast()
  }, [])

  useEffect(() => {
    if (!active) return
    const ms = active.durationMs ?? 4000
    const t = window.setTimeout(() => setActive(null), ms)
    return () => window.clearTimeout(t)
  }, [active])

  if (!active) return null

  const color = active.color ?? 'var(--green)'
  const icon = active.icon ?? '💾'
  const hasTitle = Boolean(active.title)

  const node = (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.inner}>
        <span
          className={styles.icon}
          style={{
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          }}
        >
          {icon}
        </span>
        <div className={styles.text}>
          {hasTitle ? (
            <>
              <span className={styles.title}>{active.title}</span>
              <span className={styles.sub} style={{ color }}>
                {active.msg}
              </span>
            </>
          ) : (
            <span className={styles.sub} style={{ color, fontWeight: 600 }}>
              {active.msg}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
