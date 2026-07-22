import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, action, children, className, ...rest }: CardProps) {
  return (
    <div className={[styles.card, className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <span className={styles.title}>{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
