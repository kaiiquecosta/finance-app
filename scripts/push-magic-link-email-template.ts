/**
 * Atualiza o template "Magic Link" no projeto Supabase hospedado (Management API).
 *
 * Necessário para signInWithOtp enviar o código de 6 dígitos ({{ .Token }}), não só o link "Log In".
 *
 * Uso:
 *   export SUPABASE_ACCESS_TOKEN="sbp_..."   # https://supabase.com/dashboard/account/tokens
 *   export SUPABASE_PROJECT_REF="abcdefgh" # ou VITE_SUPABASE_URL no .env.local
 *   npm run auth:push-email-template
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE = resolve(__dirname, '../supabase/email-templates/magic-link.html')
const SUBJECT = 'Seu código de acesso ao Flux'

function loadEnvLocal(): Record<string, string> {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i <= 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function projectRefFromSupabaseUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname
    const m = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

async function main() {
  const envLocal = loadEnvLocal()
  const accessToken =
    process.env.SUPABASE_ACCESS_TOKEN ?? envLocal.SUPABASE_ACCESS_TOKEN ?? ''
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    envLocal.VITE_SUPABASE_URL ??
    ''
  const projectRef =
    process.env.SUPABASE_PROJECT_REF ??
    envLocal.SUPABASE_PROJECT_REF ??
    projectRefFromSupabaseUrl(supabaseUrl) ??
    ''

  if (!accessToken) {
    console.error(
      'Defina SUPABASE_ACCESS_TOKEN (token pessoal em https://supabase.com/dashboard/account/tokens).',
    )
    process.exit(1)
  }
  if (!projectRef) {
    console.error(
      'Defina SUPABASE_PROJECT_REF ou VITE_SUPABASE_URL (ex.: https://SEU_REF.supabase.co) no ambiente ou .env.local.',
    )
    process.exit(1)
  }

  const content = readFileSync(TEMPLATE, 'utf8')
  if (!content.includes('{{ .Token }}')) {
    console.error(`O arquivo ${TEMPLATE} precisa conter {{ .Token }}.`)
    process.exit(1)
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_magic_link: SUBJECT,
      mailer_templates_magic_link_content: content,
    }),
  })

  const body = await res.text()
  if (!res.ok) {
    console.error(`Falha (${res.status}):`, body)
    process.exit(1)
  }

  console.log(`Template Magic Link aplicado no projeto ${projectRef}.`)
  console.log(`Assunto: "${SUBJECT}"`)
  console.log('Peça um novo código no app e confira o e-mail (6 dígitos).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
