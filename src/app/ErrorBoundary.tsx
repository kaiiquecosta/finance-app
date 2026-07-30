import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Captura erros de renderização e mostra um fallback amigável em vez de tela
 * branca. Ponto de plugue para observabilidade (ex.: Sentry) em componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // TODO(observabilidade): enviar para o Sentry quando VITE_SENTRY_DSN existir.
    console.error('ErrorBoundary capturou:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main className={styles.wrap}>
          <div className={styles.card}>
            <span className={styles.icon}>😕</span>
            <h1 className={styles.title}>Algo deu errado</h1>
            <p className={styles.sub}>
              Tivemos um problema ao carregar esta tela. Recarregar costuma resolver.
            </p>
            <button className={styles.btn} onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
