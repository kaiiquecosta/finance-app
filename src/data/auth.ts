/**
 * Funções de autenticação (wrappers finos sobre supabase.auth).
 * Portado do legado, com o fluxo de reset de senha COMPLETO.
 */
import type { Session } from '@supabase/supabase-js'
import { isNative, supabase } from './supabase'

const NATIVE_REDIRECT = 'com.finance.app://login-callback'

function redirectTo(path = ''): string {
  if (isNative) return NATIVE_REDIRECT
  return typeof window !== 'undefined' ? window.location.origin + path : path
}

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
