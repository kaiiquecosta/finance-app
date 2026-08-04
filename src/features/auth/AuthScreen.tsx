import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/app/theme'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import {
  sendEmailCode,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  verifyEmailCode,
} from '@/data/auth'
import { AuthEcosystem, AuthStrip, GoogleIcon, ThemeToggle } from './AuthEcosystem'
import styles from './AuthScreen.module.css'

/**
 * Passos da tela.
 *
 * O caminho principal é sem senha: `login`/`register` pedem só o e-mail, o
 * Supabase manda um código de 6 dígitos e `code` recebe esse código. Como
 * `signInWithOtp` cria a conta quando o e-mail é novo, login e cadastro são o
 * mesmo fluxo — a diferença entre `login` e `register` é apenas a copy e o campo
 * de nome.
 *
 * `password`/`forgot`/`sent` são a saída de emergência por senha. Ficam atrás de
 * um link discreto porque entrega de e-mail é ponto único de falha: caixa de
 * spam, atraso do provedor ou limite de envio do SMTP deixariam todo mundo
 * (inclusive quem administra) sem conseguir entrar.
 */
type Step = 'login' | 'register' | 'code' | 'password' | 'forgot' | 'sent'

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou senha incorretos.'
  if (m.includes('token has expired') || m.includes('expired'))
    return 'Código expirado. Peça um novo.'
  if (m.includes('invalid token') || m.includes('otp'))
    return 'Código inválido. Confira e tente de novo.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde um minuto antes de pedir outro código.'
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
  /** Passo que pediu o código — define para onde "Trocar e-mail" volta. */
  const [origin, setOrigin] = useState<'login' | 'register'>(
    initialStep === 'register' ? 'register' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  /**
   * O Google tem o próprio estado de carregamento: com um `loading` só, clicar
   * em "Entrar com o Google" fazia o botão de enviar girar (Button troca
   * children pelo spinner) enquanto o botão realmente clicado só acinzentava.
   */
  const [gLoading, setGLoading] = useState(false)
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)

  function go(next: Step) {
    setError('')
    setInfo('')
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

  /** Pede o código. Serve para `login` e para `register` (só muda o nome). */
  const onRequestCode = (from: 'login' | 'register') => (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await sendEmailCode(email.trim(), from === 'register' ? name.trim() : undefined)
      setOrigin(from)
      setCode('')
      go('code')
    })
  }

  const onVerifyCode = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await verifyEmailCode(email.trim(), code.trim())
      // onAuthStateChange (useSession) troca a tela automaticamente.
    })
  }

  const onResend = () =>
    run(async () => {
      await sendEmailCode(email.trim())
      setInfo('Código reenviado. Confira sua caixa de entrada.')
    })

  const onPasswordLogin = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await signInWithEmail(email.trim(), password)
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

  const emailField = (
    <TextField
      label="E-mail de acesso"
      name="email"
      type="email"
      autoComplete="email"
      placeholder="voce@email.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
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
            <form className={styles.form} onSubmit={onRequestCode('login')}>
              {/* "Bem-vindo de volta" precisa continuar no título: e2e/auth.spec.ts
                  casa o heading por substring. */}
              <h1 className={styles.title}>
                Bem-vindo de volta ao<span className={styles.titleBrand}>Flux</span>
              </h1>
              <p className={styles.subtitle}>Sem senha: enviamos um código para o seu e-mail.</p>
              {googleButton}
              <div className={styles.divider}>ou entre com e-mail</div>
              {emailField}
              {error && <p className={styles.error}>{error}</p>}
              <Button type="submit" block loading={loading} disabled={gLoading}>
                Enviar código
              </Button>
              <p className={styles.foot}>
                Não tem conta?{' '}
                <button type="button" className={styles.linkInline} onClick={() => go('register')}>
                  Criar conta
                </button>
              </p>
              <button type="button" className={styles.link} onClick={() => go('password')}>
                Entrar com senha
              </button>
              {legal}
            </form>
          )}

          {step === 'register' && (
            <form className={styles.form} onSubmit={onRequestCode('register')}>
              {/* "Criar conta" precisa continuar no título: e2e/auth.spec.ts
                  casa o heading por substring. */}
              <h1 className={styles.title}>
                Criar conta no<span className={styles.titleBrand}>Flux</span>
              </h1>
              <p className={styles.subtitle}>
                30 dias grátis. Sem senha para criar — enviamos um código por e-mail.
              </p>
              {googleButton}
              <div className={styles.divider}>ou entre com e-mail</div>
              <TextField
                label="Nome"
                name="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {emailField}
              {error && <p className={styles.error}>{error}</p>}
              <Button type="submit" block loading={loading} disabled={gLoading}>
                Enviar código
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

          {step === 'code' && (
            <form className={styles.form} onSubmit={onVerifyCode}>
              <h1 className={styles.title}>Digite o código</h1>
              <p className={styles.subtitle}>
                Enviamos um código de 6 dígitos para <b>{email}</b>. Ele vale por pouco tempo.
              </p>
              <TextField
                label="Código"
                name="one-time-code"
                /* one-time-code deixa o sistema oferecer o preenchimento automático */
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                className={styles.codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              {info && <p className={styles.info}>{info}</p>}
              <Button type="submit" block loading={loading} disabled={code.length < 6}>
                Entrar
              </Button>
              <button type="button" className={styles.link} onClick={onResend} disabled={loading}>
                Reenviar código
              </button>
              <button type="button" className={styles.link} onClick={() => go(origin)}>
                Usar outro e-mail
              </button>
            </form>
          )}

          {step === 'password' && (
            <form className={styles.form} onSubmit={onPasswordLogin}>
              <h1 className={styles.title}>Entrar com senha</h1>
              <p className={styles.subtitle}>
                Para quem criou a conta com senha. O caminho recomendado é o código por e-mail.
              </p>
              {emailField}
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
              <button type="button" className={styles.link} onClick={() => go('login')}>
                Entrar com código por e-mail
              </button>
            </form>
          )}

          {step === 'forgot' && (
            <form className={styles.form} onSubmit={onForgot}>
              <h1 className={styles.title}>Recuperar senha</h1>
              <p className={styles.subtitle}>Enviaremos um link para seu email</p>
              {emailField}
              {error && <p className={styles.error}>{error}</p>}
              <Button type="submit" block loading={loading}>
                Enviar link
              </Button>
              <button type="button" className={styles.link} onClick={() => go('password')}>
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
        </div>

        {/* Fora do card: decorativo, sem foco e sem leitura de tela.
            Renderizado DEPOIS do card, então nunca precede o formulário. */}
        <AuthEcosystem />
        {step === 'register' && <AuthStrip />}
      </div>
    </main>
  )
}
