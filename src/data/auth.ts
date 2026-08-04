/**
 * Funções de autenticação (wrappers finos sobre supabase.auth).
 * Portado do legado, com o fluxo de reset de senha COMPLETO.
 */
import type { Session } from '@supabase/supabase-js'
import { Browser } from '@capacitor/browser'
import { isNative, supabase } from './supabase'

const NATIVE_REDIRECT = 'com.finance.app://login-callback'

/**
 * URL de retorno do fluxo de auth. No nativo, a rota pretendida (ex.:
 * "/redefinir-senha") vai como query param — o app não navega por URL de
 * verdade, então `nativeAuth.ts` lê esse param no deep link e navega manualmente.
 */
function redirectTo(path = ''): string {
  if (isNative) {
    return path ? `${NATIVE_REDIRECT}?path=${encodeURIComponent(path)}` : NATIVE_REDIRECT
  }
  return typeof window !== 'undefined' ? window.location.origin + path : path
}

/**
 * Envia o código de acesso de 6 dígitos por e-mail. É o caminho principal de
 * entrada: se o e-mail não tem conta, o Supabase cria (shouldCreateUser é o
 * padrão), então login e cadastro acontecem na mesma tela.
 *
 * ATENÇÃO — DEPENDE DE CONFIGURAÇÃO NO PAINEL DO SUPABASE:
 * por padrão este método envia um LINK mágico, não um código. Para chegar o
 * código de 6 dígitos, o template de e-mail "Magic Link" precisa conter
 * {{ .Token }}. Sem isso a pessoa recebe um link e não tem o que digitar.
 * Ver docs/AUTH.md.
 *
 * `fullName` só é aplicado quando o usuário é CRIADO — em logins seguintes o
 * Supabase ignora options.data.
 */
export async function sendEmailCode(email: string, fullName?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo(),
      ...(fullName ? { data: { full_name: fullName } } : {}),
    },
  })
  if (error) throw error
}

/**
 * Confere o código digitado e abre a sessão. `onAuthStateChange` (useSession)
 * troca a tela sozinho, igual ao login por senha.
 *
 * No app nativo isto NÃO precisa de deep link: o código é digitado dentro do
 * app, então não há ida e volta pelo navegador do sistema (ao contrário do
 * login com Google, que depende do com.finance.app://login-callback).
 */
export async function verifyEmailCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
  return data
}

/**
 * Login por senha. Deixou de ser o caminho principal, mas continua disponível
 * como saída de emergência: entrega de e-mail é ponto único de falha (spam,
 * atraso do provedor, limite de envio do SMTP), e sem isto uma falha de e-mail
 * tranca todo mundo fora da própria conta — inclusive quem administra o app.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: redirectTo() },
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo(), skipBrowserRedirect: isNative },
  })
  if (error) throw error
  // No nativo, `skipBrowserRedirect` impede o redirect automático — quem abre
  // o navegador do sistema com a URL de login é o próprio app (Browser.open).
  // O retorno chega via deep link (com.finance.app://…), tratado em nativeAuth.ts.
  if (isNative && data.url) {
    await Browser.open({ url: data.url })
  }
  return data
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo('/redefinir-senha'),
  })
  if (error) throw error
}

/**
 * Efetiva a troca de senha após o usuário clicar no link de recuperação.
 * (No legado isto NÃO existia — a tela de reset só reenviava o email.)
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Assina mudanças de estado de auth; retorna a função para cancelar. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session))
  return () => data.subscription.unsubscribe()
}
