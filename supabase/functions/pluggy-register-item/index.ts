/**
 * Registra um Item ID da Pluggy (Meu Pluggy / Connect) para o usuário autenticado.
 * Body: { pluggyItemId: string, mode?: 'personal' | 'sandbox' | 'commercial' }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getItem } from '../_shared/pluggyClient.ts'

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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { pluggyItemId, mode = 'personal' } = (await req.json()) as {
      pluggyItemId?: string
      mode?: string
    }
    if (!pluggyItemId?.trim()) return json({ error: 'pluggyItemId é obrigatório' }, 400)

    if (mode === 'commercial') {
      const { data: planRow } = await admin
        .from('plans')
        .select('plan, status, trial_ends_at')
        .eq('user_id', user.id)
        .maybeSingle()
      const pro =
        (planRow?.plan === 'pro' && planRow?.status === 'active') ||
        planRow?.status === 'trialing'
      if (!pro) {
        return json({ error: 'Open Finance comercial requer plano Pro/trial.' }, 403)
      }
    }

    let connectorId: number | null = null
    let connectorName: string | null = null
    let status = 'UPDATED'
    try {
      const item = await getItem(pluggyItemId.trim())
      status = item.status
      connectorId = item.connector?.id ?? null
      connectorName = item.connector?.name ?? null
    } catch (e) {
      return json({
        error: 'Item não encontrado na Pluggy. Verifique o ID e se o Meu Pluggy está vinculado ao app de desenvolvimento.',
        detail: e instanceof Error ? e.message : String(e),
      }, 400)
    }

    const { data, error } = await admin
      .from('financial_connections')
      .upsert(
        {
          user_id: user.id,
          provider: 'pluggy',
          mode,
          pluggy_item_id: pluggyItemId.trim(),
          connector_id: connectorId,
          connector_name: connectorName,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,pluggy_item_id' },
      )
      .select('*')
      .single()
    if (error) throw error

    return json({ connection: data })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao registrar conexão' }, 500)
  }
})
