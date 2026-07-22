import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/data/auth'
import styles from './AuthScreen.module.css'

type Step = 'login' | 'register' | 'forgot' | 'sent' | 'verify'

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este email já está cadastrado.'
  if (m.includes('password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'Email inválido.'
  if (m.includes('email not confirmed')) return 'Confirme seu email antes de entrar.'
  return msg
}

export function AuthScreen() {
  const [step, setStep] = useState<Step>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function go(next: Step) {
    setError('')
    setStep(next)
  }

  async function run(fn: () => Promise<void>) {
    setError('')
    setLoading(true)
    try {
      await fn()
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.'))
    } finally {
      setLoading(false)
    }
  }

  const onLogin = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await signInWithEmail(email.trim(), password)
      // onAuthStateChange (useSession) troca a tela automaticamente.
    })
  }

  const onRegister = (e: FormEvent) => {
    e.preventDefault()
    if (password !== password2) return setError('As senhas não conferem.')
    run(async () => {
      await signUpWithEmail(email.trim(), password, name.trim())
      go('verify')
    })
  }

  const onForgot = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await sendPasswordReset(email.trim())
      go('sent')
    })
  }

  const onGoogle = () => run(async () => void (await signInWithGoogle()))

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.brand}>
          <span className={styles.logo}>F</span>
          <span className={styles.brandName}>Finance</span>
        </div>

        {step === 'login' && (
          <form className={styles.form} onSubmit={onLogin}>
            <h1 className={styles.title}>Bem-vindo de volta</h1>
            <p className={styles.subtitle}>Entre para continuar</p>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Senha"
              name="password"
              reveal
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" block loading={loading}>
              Entrar
            </Button>
            <button type="button" className={styles.link} onClick={() => go('forgot')}>
              Esqueci minha senha
            </button>
            <div className={styles.divider}>ou</div>
            <Button type="button" variant="ghost" block onClick={onGoogle} disabled={loading}>
              Entrar com Google
            </Button>
            <p className={styles.foot}>
              Não tem conta?{' '}
              <button type="button" className={styles.linkInline} onClick={() => go('register')}>
                Criar conta
              </button>
            </p>
          </form>
        )}

        {step === 'register' && (
          <form className={styles.form} onSubmit={onRegister}>
            <h1 className={styles.title}>Criar conta</h1>
            <p className={styles.subtitle}>Comece com 30 dias grátis</p>
            <TextField
              label="Nome"
              name="name"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Senha"
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
              Criar conta
            </Button>
            <p className={styles.foot}>
              Já tem conta?{' '}
              <button type="button" className={styles.linkInline} onClick={() => go('login')}>
                Entrar
              </button>
            </p>
          </form>
        )}

        {step === 'forgot' && (
          <form className={styles.form} onSubmit={onForgot}>
            <h1 className={styles.title}>Recuperar senha</h1>
            <p className={styles.subtitle}>Enviaremos um link para seu email</p>
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" block loading={loading}>
              Enviar link
            </Button>
            <button type="button" className={styles.link} onClick={() => go('login')}>
              Voltar
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div className={styles.form}>
            <h1 className={styles.title}>Email enviado ✉️</h1>
            <p className={styles.subtitle}>
              Se existe uma conta com <b>{email}</b>, o link de recuperação chegou. Confira sua caixa
              de entrada (e o spam).
            </p>
            <Button type="button" block onClick={() => go('login')}>
              Voltar ao login
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className={styles.form}>
            <h1 className={styles.title}>Confirme seu email 📬</h1>
            <p className={styles.subtitle}>
              Enviamos um link de confirmação para <b>{email}</b>. Clique nele para ativar sua conta.
            </p>
            <Button type="button" block onClick={() => go('login')}>
              Voltar ao login
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
