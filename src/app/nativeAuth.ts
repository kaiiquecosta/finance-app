/**
 * Tratamento do retorno de login no app nativo (Android/iOS via Capacitor).
 *
 * No nativo, o login com Google abre o navegador do sistema (Browser.open em
 * auth.ts) e o Supabase redireciona de volta via deep link:
 *   com.finance.app://login-callback?code=...&path=%2Fredefinir-senha
 *
 * Aqui capturamos essa URL, trocamos o `code` pela sessão (PKCE) e, se havia
 * uma rota pretendida (`path` — usado no reset de senha), guardamos para o
 * App.tsx navegar até ela assim que a sessão estiver disponível.
 */
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '@/data/supabase'

export const NATIVE_PENDING_PATH_KEY = 'finance_native_pending_path'

async function handleDeepLink(url: string): Promise<void> {
  if (!url.startsWith('com.finance.app://')) return

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return
  }

  const path = parsed.searchParams.get('path')
  if (path) sessionStorage.setItem(NATIVE_PENDING_PATH_KEY, path)

  const code = parsed.searchParams.get('code')
  await Browser.close().catch(() => {})
  if (!code) return

  try {
    await supabase.auth.exchangeCodeForSession(code)
  } catch {
    // Sessão inválida/expirada — o usuário permanece na tela de login.
  }
}

/** Assina o evento de retorno por deep link. Não faz nada na web. */
export function initNativeAuthListener(): void {
  if (!Capacitor.isNativePlatform()) return
  void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void handleDeepLink(url)
  })
}
