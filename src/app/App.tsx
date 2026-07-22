import styles from './App.module.css'

/**
 * Placeholder da Fase 0 — apenas confirma que a fundação
 * (React + TS + Vite + tema) está de pé. As rotas, páginas e
 * a landing entram nas fases seguintes.
 */
export function App() {
  return (
    <main className={styles.boot}>
      <div className={styles.card}>
        <div className={styles.logo}>F</div>
        <h1 className={styles.title}>Finance</h1>
        <p className={styles.subtitle}>
          Fundação <strong>React + TypeScript + Vite</strong> pronta.
        </p>
        <span className={styles.badge}>v2 · em construção</span>
      </div>
    </main>
  )
}
