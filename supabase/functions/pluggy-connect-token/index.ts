/**
 * Emite Connect Token para o widget Pluggy Connect (Fase 2 — Sandbox/Produção).
 * Body opcional: { clientUserId?: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'
import { createConnectToken } from '../_shared/pluggyClient.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Sessão inválida' }, 401)

    const body = (await req.json().catch(() => ({}))) as { clientUserId?: string }
    const clientUserId = body.clientUserId ?? user.id
    const accessToken = await createConnectToken(clientUserId)

    return json({ accessToken, expiresInMinutes: 30 })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao criar connect token' }, 500)
  }
})
