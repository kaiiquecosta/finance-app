/**
 * Cliente Supabase (singleton). Configuração portada do legado:
 * PKCE no app nativo (Capacitor), implicit na web.
 * As chaves vêm de variáveis de ambiente (públicas — protegidas por RLS).
 */
import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local',
  )
}

export const isNative = Capacitor.isNativePlatform()

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative,
    flowType: isNative ? 'pkce' : 'implicit',
  },
})
