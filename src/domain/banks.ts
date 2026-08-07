import { BANK_CATALOG } from './bankPresetsCatalog'

/** Presets de instituições financeiras — cor de marca, monograma e busca global. */
export type BankPreset = {
  id: string
  name: string
  color: string
  /** Texto/símbolo exibido no botão (monograma da marca). */
  mark: string
  /** Palavras extras para busca (apelidos, siglas). */
  keywords?: string[]
  /** Domínio da marca para logo (Clearbit). */
  domain?: string
  /** URL explícita de logo (opcional). */
  logoUrl?: string
  /** Exibir na grade sem termo de busca. */
  featured?: boolean
  /** Ordem de popularidade (menor = mais conhecido). */
  rank?: number
}

export const ALL_BANK_PRESETS: BankPreset[] = BANK_CATALOG

/** Bancos exibidos “à vista” (cartão, salário, contas). */
export const FEATURED_BANK_PRESETS: BankPreset[] = ALL_BANK_PRESETS.filter((p) => p.featured).sort(
  (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
)

/** @deprecated Use FEATURED_BANK_PRESETS ou ALL_BANK_PRESETS. Mantido por compatibilidade. */
export const BRAZIL_BANK_PRESETS = FEATURED_BANK_PRESETS

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()

function presetMatchesQuery(p: BankPreset, q: string): boolean {
  if (norm(p.name).includes(q)) return true
  if (norm(p.mark).includes(q)) return true
  if (p.id.includes(q)) return true
  return p.keywords?.some((k) => norm(k).includes(q)) ?? false
}

function relevanceScore(p: BankPreset, q: string): number {
  const name = norm(p.name)
  const id = norm(p.id)
  if (name === q || id === q) return 0
  if (name.startsWith(q)) return 1
  if (id.startsWith(q)) return 2
  if (name.includes(q)) return 3
  if (p.keywords?.some((k) => norm(k).startsWith(q))) return 4
  if (p.keywords?.some((k) => norm(k).includes(q))) return 5
  if (norm(p.mark).includes(q)) return 6
  return 7
}

function sortPresets(list: BankPreset[], q?: string): BankPreset[] {
  return [...list].sort((a, b) => {
    if (q) {
      const dr = relevanceScore(a, q) - relevanceScore(b, q)
      if (dr !== 0) return dr
    }
    return (a.rank ?? 999) - (b.rank ?? 999) || norm(a.name).localeCompare(norm(b.name), 'pt-BR')
  })
}

/**
 * Lista para o seletor: sem busca → destaques; com busca → catálogo inteiro, do mais conhecido ao mais nicho.
 */
export function filterBankPresets(query: string, presets?: BankPreset[]): BankPreset[] {
  const q = norm(query)
  if (presets) {
    if (!q) return sortPresets(presets)
    return sortPresets(presets.filter((p) => presetMatchesQuery(p, q)), q)
  }
  if (!q) return FEATURED_BANK_PRESETS
  const matched = ALL_BANK_PRESETS.filter((p) => presetMatchesQuery(p, q))
  return sortPresets(matched, q)
}

/** Tenta casar uma conta salva com um preset (para ícone/cor). */
export function matchBankPreset(accountName: string): BankPreset | undefined {
  const n = norm(accountName)
  return ALL_BANK_PRESETS.find((p) => {
    const pn = norm(p.name)
    if (n === pn || n.startsWith(pn)) return true
    if (pn.length >= 2 && n.includes(pn)) return true
    return p.keywords?.some((k) => {
      const kn = norm(k)
      return kn.length >= 2 && n.includes(kn)
    })
  })
}

export function bankPresetById(id: string): BankPreset | undefined {
  return ALL_BANK_PRESETS.find((p) => p.id === id)
}

export function isKnownBankPresetName(name: string): boolean {
  const n = norm(name)
  return ALL_BANK_PRESETS.some((p) => norm(p.name) === n)
}

/** URL de logo da marca (fallback visual no BankMark). */
export function bankLogoUrl(preset: Pick<BankPreset, 'logoUrl' | 'domain'>): string | null {
  if (preset.logoUrl) return preset.logoUrl
  if (preset.domain) return `https://logo.clearbit.com/${preset.domain}`
  return null
}

/** Contraste de texto sobre a cor de marca. */
export function bankButtonTextColor(hex: string): '#ffffff' | '#0f172a' {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#ffffff'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 168 ? '#0f172a' : '#ffffff'
}
