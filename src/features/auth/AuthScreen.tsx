import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/app/theme'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/data/auth'
import { AuthEcosystem, AuthStrip, GoogleIcon, ThemeToggle } from './AuthEcosystem'
import styles from './AuthScreen.module.css'

type Step = 'login' | 'register' | 'forgot' | 'sent' | 'verify'

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este email já está cadastrado.'
  if (m.includes('password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).'
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Email inválido.'
  if (m.includes('email not confirmed')) return 'Confirme seu email antes de entrar.'
  return msg
}

export function AuthScreen({ initialStep = 'login' }: { initialStep?: Step }) {
  const [step, setStep] = useState<Step>(initialStep)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /**
   * O Google tem o próprio estado de carregamento: com um `loading` só, clicar
   * em "Entrar com o Google" fazia o botão "Entrar" girar (Button troca children
   * pelo spinner) enquanto o botão realmente clicado apenas acinzentava.
   */
  const [gLoading, setGLoading] = useState(false)
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)

  function go(next: Step) {
    setError('')
    setStep(next)
  }

  async function run(fn: () => Promise<void>, setBusy = setLoading) {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.'))
    } finally {
      setBusy(false)
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

  const onGoogle = () => run(async () => void (await signInWithGoogle()), setGLoading)

  const googleButton = (
    <Button
      type="button"
      variant="ghost"
      block
      className={styles.googleBtn}
      onClick={onGoogle}
      loading={gLoading}
      disabled={loading}
    >
      <GoogleIcon />
      Entrar com o Google
    </Button>
  )

  const legal = (
    <p className={styles.legal}>
      Ao continuar, você concorda com os <Link to="/termos">Termos</Link> e a{' '}
      <Link to="/privacidade">Política de Privacidade</Link>.
    </p>
  )

  return (
    <main className={styles.screen}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className={styles.stack}>
        <div className={styles.box}>
          <div className={styles.brand}>
            <span className={styles.logo}>F</span>
            <span className={styles.brandName}>Flux</span>
          </div>

          {step === 'login' && (
            <form className={styles.form} onSubmit={onLogin}>
              {/* "Bem-vindo de volta" precisa continuar no título: e2e/auth.spec.ts:26
                casa o heading por substring. */}
              <h1 className={styles.title}>
                Bem-vindo de volta ao<span className={styles.titleBrand}>Flux</span>
              </h1>
              <p className={styles.subtitle}>
                Suas finanças, cartões e investimentos num só lugar.
              </p>
              {googleButton}
              <div className={styles.divider}>ou entre com e-mail</div>
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
              <Button type="submit" block loading={loading} disabled={gLoading}>
                Entrar
              </Button>
              <button type="button" className={styles.link} onClick={() => go('forgot')}>
                Esqueci minha senha
              </button>
              <p className={styles.foot}>
                Não tem conta?{' '}
                <button type="button" className={styles.linkInline} onClick={() => go('register')}>
                  Criar conta
                </button>
              </p>
              {legal}
            </form>
          )}

          {step === 'register' && (
            <form className={styles.form} onSubmit={onRegister}>
              {/* "Criar conta" precisa continuar no título: e2e/auth.spec.ts:24
                casa o heading por substring. */}
              <h1 className={styles.title}>
                Criar conta no<span className={styles.titleBrand}>Flux</span>
              </h1>
              <p className={styles.subtitle}>
                30 dias grátis. O cartão só é pedido se você assinar o Pro.
              </p>
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
              {legal}
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
                Se existe uma conta com <b>{email}</b>, o link de recuperação chegou. Confira sua
                caixa de entrada (e o spam).
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
                Enviamos um link de confirmação para <b>{email}</b>. Clique nele para ativar sua
                conta.
              </p>
              <Button type="button" block onClick={() => go('login')}>
                Voltar ao login
              </Button>
            </div>
          )}
        </div>

        {/* Fora do card: decorativo, sem foco e sem leitura de tela.
            Renderizado DEPOIS do card, então nunca precede o formulário. */}
        <AuthEcosystem />
        {step === 'register' && <AuthStrip />}
      </div>
    </main>
  )
}
