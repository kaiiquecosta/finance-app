import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { updatePassword } from '@/data/auth'
import styles from './AuthScreen.module.css'

/**
 * Destino do link de recuperação (Supabase cria uma sessão de recovery e
 * redireciona para cá). Aqui o usuário define a NOVA senha — fluxo que não
 * existia no legado.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Senha muito curta (mínimo 6 caracteres).')
    if (password !== password2) return setError('As senhas não conferem.')
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.brand}>
          <span className={styles.logo}>F</span>
          <span className={styles.brandName}>Flux</span>
        </div>
        {done ? (
          <div className={styles.form}>
            <h1 className={styles.title}>Senha alterada ✅</h1>
            <p className={styles.subtitle}>Sua nova senha já está valendo.</p>
            <Button block onClick={() => navigate('/app')}>
              Ir para o app
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <h1 className={styles.title}>Nova senha</h1>
            <p className={styles.subtitle}>Defina uma nova senha para sua conta</p>
            <TextField
              label="Nova senha"
              name="new-password"
              reveal
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Confirmar senha"
              name="confirm-password"
              reveal
              placeholder="Repita a senha"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" block loading={loading}>
              Salvar senha
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
