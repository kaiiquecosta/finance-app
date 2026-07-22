import { Button } from '@/components/ui/Button'
import { signOut } from '@/data/auth'
import { useTheme } from '@/app/theme'
import styles from './AuthedHome.module.css'

export function AuthedHome({ email }: { email: string }) {
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>F</div>
        <h1 className={styles.title}>Você está dentro 🎉</h1>
        <p className={styles.sub}>
          Logado como <b>{email}</b>
        </p>
        <span className={styles.badge}>App em construção · Fase 3</span>
        <div className={styles.row}>
          <Button variant="ghost" onClick={toggle}>
            {theme === 'dark' ? '☀️ Tema claro' : '🌙 Tema escuro'}
          </Button>
          <Button variant="danger" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </main>
  )
}
