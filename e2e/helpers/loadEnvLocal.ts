import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Carrega `.env.local` no processo Node (Playwright não usa o loader do Vite). */
export function loadEnvLocal(): void {
  try {
    const content = readFileSync(resolve(repoRoot, '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (process.env[key] == null || process.env[key] === '') {
        process.env[key] = value
      }
    }
  } catch {
    /* .env.local opcional em CI */
  }
}

export function supabaseAuthStorageKey(): string {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  const ref = url.match(/https:\/\/([^.]+)\./)?.[1] ?? 'local'
  return `sb-${ref}-auth-token`
}
