import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import styles from './legal.module.css'

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <span className={styles.dot} />
          Flux
        </Link>
        <Link to="/" className={styles.back}>
          ← Início
        </Link>
      </header>
      <main className={styles.content}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.updated}>Última atualização: {updated}</p>
        <div className={styles.prose}>{children}</div>
        <p className={styles.disclaimer}>
          ⚠️ Este documento é um modelo inicial e deve ser revisado por um profissional jurídico
          antes do lançamento público.
        </p>
      </main>
    </div>
  )
}
