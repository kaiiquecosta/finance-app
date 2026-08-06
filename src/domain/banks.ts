/** Presets de instituições financeiras (Brasil) — cor de marca e marca visual curta. */
export type BankPreset = {
  id: string
  name: string
  color: string
  /** Texto/símbolo exibido no botão (monograma da marca). */
  mark: string
  /** Palavras extras para busca (apelidos, siglas). */
  keywords?: string[]
}

export const BRAZIL_BANK_PRESETS: BankPreset[] = [
  { id: 'nubank', name: 'Nubank', color: '#820AD1', mark: 'nu', keywords: ['roxinho', 'nu'] },
  { id: 'itau', name: 'Itaú', color: '#EC7000', mark: 'Itaú', keywords: ['itaú unibanco'] },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F', mark: 'B', keywords: ['bradesco fin'] },
  { id: 'santander', name: 'Santander', color: '#EC0000', mark: 'S', keywords: [] },
  { id: 'bb', name: 'Banco do Brasil', color: '#FDF429', mark: 'BB', keywords: ['bb', 'banco brasil'] },
  { id: 'caixa', name: 'Caixa', color: '#005CA9', mark: 'CX', keywords: ['cef', 'caixa econômica'] },
  { id: 'inter', name: 'Inter', color: '#FF7A00', mark: 'inter', keywords: ['banco inter'] },
  { id: 'c6', name: 'C6 Bank', color: '#242424', mark: 'C6', keywords: ['c6 bank'] },
  { id: 'btg', name: 'BTG Pactual', color: '#002855', mark: 'BTG', keywords: ['btg', 'pactual'] },
  { id: 'xp', name: 'XP', color: '#111111', mark: 'XP', keywords: ['xp investimentos'] },
  { id: 'picpay', name: 'PicPay', color: '#21C25E', mark: 'P', keywords: [] },
  { id: 'mercadopago', name: 'Mercado Pago', color: '#009EE3', mark: 'MP', keywords: ['mercado pago', 'mp'] },
  { id: 'neon', name: 'Neon', color: '#00D4FF', mark: 'neon', keywords: [] },
  { id: 'pagbank', name: 'PagBank', color: '#00A868', mark: 'PB', keywords: ['pagseguro', 'pag bank'] },
  { id: 'original', name: 'Original', color: '#00A651', mark: 'O', keywords: ['banco original'] },
  { id: 'safra', name: 'Safra', color: '#1B365D', mark: 'Safra', keywords: [] },
  { id: 'banrisul', name: 'Banrisul', color: '#005BAA', mark: 'BR', keywords: [] },
  { id: 'sicoob', name: 'Sicoob', color: '#009639', mark: 'Sc', keywords: ['cooperativa'] },
  { id: 'sicredi', name: 'Sicredi', color: '#3E6C45', mark: 'Si', keywords: [] },
  { id: 'sofisa', name: 'Sofisa', color: '#00A859', mark: 'Sf', keywords: ['sofisa direto'] },
  { id: 'will', name: 'Will Bank', color: '#FFD100', mark: 'W', keywords: ['will'] },
  { id: 'pan', name: 'Banco Pan', color: '#0066CC', mark: 'Pan', keywords: ['pan'] },
  { id: 'bv', name: 'BV', color: '#004B8D', mark: 'BV', keywords: ['banco bv', 'votorantim'] },
  { id: 'daycoval', name: 'Daycoval', color: '#003DA5', mark: 'D', keywords: [] },
  { id: 'rico', name: 'Rico', color: '#FF6600', mark: 'R', keywords: ['rico investimentos'] },
  { id: 'clear', name: 'Clear', color: '#000000', mark: 'Cl', keywords: ['clear corretora'] },
  { id: 'avenue', name: 'Avenue', color: '#0EA5E9', mark: 'Av', keywords: [] },
  { id: 'nomad', name: 'Nomad', color: '#1A1A1A', mark: 'N', keywords: [] },
  { id: 'wise', name: 'Wise', color: '#9FE870', mark: 'W', keywords: ['transferwise'] },
  { id: 'binance', name: 'Binance', color: '#F0B90B', mark: 'B', keywords: [] },
  { id: 'next', name: 'Next', color: '#00FF00', mark: 'Nx', keywords: ['next bradesco'] },
  { id: 'digio', name: 'Digio', color: '#0066FF', mark: 'Dg', keywords: [] },
  { id: 'agibank', name: 'Agibank', color: '#87CE00', mark: 'Ag', keywords: [] },
  { id: 'bmg', name: 'BMG', color: '#FF6600', mark: 'BMG', keywords: [] },
  { id: 'credicard', name: 'Credicard', color: '#E4002B', mark: 'CC', keywords: [] },
  { id: 'portoseguro', name: 'Porto Seguro', color: '#0066CC', mark: 'PS', keywords: ['porto bank'] },
  { id: 'bancointer', name: 'Superdigital', color: '#7C3AED', mark: 'Sd', keywords: [] },
  { id: 'bs2', name: 'BS2', color: '#003366', mark: 'BS2', keywords: [] },
  { id: 'toro', name: 'Toro Investimentos', color: '#6366F1', mark: 'T', keywords: ['toro'] },
  { id: 'genial', name: 'Genial', color: '#0F172A', mark: 'G', keywords: ['genial investimentos'] },
]

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()

/** Filtra presets pelo termo (nome ou keywords). */
export function filterBankPresets(query: string, presets = BRAZIL_BANK_PRESETS): BankPreset[] {
  const q = norm(query)
  if (!q) return presets
  return presets.filter((p) => {
    if (norm(p.name).includes(q)) return true
    if (norm(p.mark).includes(q)) return true
    return p.keywords?.some((k) => norm(k).includes(q))
  })
}

/** Tenta casar uma conta salva com um preset (para ícone/cor). */
export function matchBankPreset(accountName: string): BankPreset | undefined {
  const n = norm(accountName)
  return BRAZIL_BANK_PRESETS.find((p) => {
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
  return BRAZIL_BANK_PRESETS.find((p) => p.id === id)
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
