// Transcreve áudio curto (assistante) via OpenAI Whisper — fallback para navegadores
// sem Web Speech API (Firefox, alguns PWAs).
//
// Segredo: OPENAI_API_KEY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'

const MAX_BYTES = 8 * 1024 * 1024

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return json(
        {
          error: 'transcription_unconfigured',
          message:
            'Configure OPENAI_API_KEY nos secrets do Supabase para áudio neste navegador.',
        },
        503,
      )
    }

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

    const body = (await req.json()) as { audio?: string; mime?: string }
    const b64 = body.audio?.trim()
    const mime = body.mime?.trim() || 'audio/webm'
    if (!b64) return json({ error: 'Áudio ausente' }, 400)

    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    if (binary.byteLength > MAX_BYTES) return json({ error: 'Áudio muito longo' }, 413)
    if (binary.byteLength < 100) return json({ error: 'Áudio vazio' }, 400)

    const ext = mime.includes('mp4') || mime.includes('aac') ? 'm4a' : 'webm'
    const file = new File([binary], `flux.${ext}`, { type: mime })

    const form = new FormData()
    form.append('file', file)
    form.append('model', 'whisper-1')
    form.append('language', 'pt')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      const detail = await whisperRes.text()
      console.error('whisper error', whisperRes.status, detail)
      return json({ error: 'Falha ao transcrever áudio' }, 502)
    }

    const whisperJson = (await whisperRes.json()) as { text?: string }
    const text = (whisperJson.text ?? '').trim()
    return json({ text })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Erro interno' }, 500)
  }
})
