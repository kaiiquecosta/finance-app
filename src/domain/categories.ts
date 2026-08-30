/**
 * Categorias: ícones, cores e inferência por nome.
 * Mapas e regex portados verbatim de `legacy/index.html` (CI/CC/inferCat).
 */

/** Ícone (emoji) por categoria. */
export const CATEGORY_ICONS: Record<string, string> = {
  mercado: '🛒',
  alimentação: '🍔',
  restaurante: '🍽️',
  lanche: '🍟',
  delivery: '🛵',
  ifood: '🛵',
  'uber eats': '🛵',
  streaming: '📺',
  netflix: '🎬',
  spotify: '🎵',
  disney: '🏰',
  'amazon prime': '📦',
  transporte: '🚗',
  combustível: '⛽',
  uber: '🚕',
  '99': '🚕',
  ônibus: '🚌',
  metrô: '🚇',
  saúde: '💊',
  farmácia: '💊',
  academia: '💪',
  médico: '🩺',
  compras: '📦',
  roupas: '👕',
  calçados: '👟',
  eletrônicos: '📱',
  games: '🎮',
  educação: '📚',
  curso: '🎓',
  livros: '📖',
  moradia: '🏠',
  aluguel: '🏠',
  condomínio: '🏢',
  energia: '⚡',
  água: '💧',
  internet: '📡',
  gás: '🔥',
  lazer: '🎉',
  viagem: '✈️',
  hotel: '🏨',
  pet: '🐾',
  presente: '🎁',
  investimento: '📈',
  receita: '💰',
  salário: '💵',
  freelance: '💼',
  outros: '💳',
  cartão: '💳',
  banco: '🏦',
  'contas de casa': '🏠',
}

/** Cor (hex) por categoria. */
export const CATEGORY_COLORS: Record<string, string> = {
  mercado: '#22c55e',
  alimentação: '#f97316',
  restaurante: '#fb923c',
  lanche: '#f97316',
  delivery: '#f97316',
  ifood: '#ea1d2c',
  'uber eats': '#06c167',
  streaming: '#8b5cf6',
  netflix: '#e50914',
  spotify: '#1db954',
  disney: '#113ccf',
  'amazon prime': '#00a8e0',
  transporte: '#3b82f6',
  combustível: '#f59e0b',
  uber: '#000000',
  '99': '#ffcc00',
  ônibus: '#38bdf8',
  metrô: '#6366f1',
  saúde: '#ec4899',
  farmácia: '#f43f5e',
  academia: '#22c55e',
  médico: '#06b6d4',
  compras: '#f59e0b',
  roupas: '#e879f9',
  calçados: '#c084fc',
  eletrônicos: '#94a3b8',
  games: '#7c3aed',
  educação: '#a78bfa',
  curso: '#8b5cf6',
  livros: '#6366f1',
  moradia: '#64748b',
  aluguel: '#475569',
  condomínio: '#64748b',
  energia: '#fbbf24',
  água: '#38bdf8',
  internet: '#3b82f6',
  gás: '#f97316',
  lazer: '#34d399',
  viagem: '#0ea5e9',
  hotel: '#38bdf8',
  pet: '#f472b6',
  presente: '#fb7185',
  investimento: '#10b981',
  receita: '#22c55e',
  salário: '#22c55e',
  freelance: '#4ade80',
  outros: '#d946ef',
  cartão: '#94a3b8',
  banco: '#60a5fa',
  'contas de casa': '#0891b2',
}

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const

export interface PayMethodOption {
  id: string
  label: string
  icon: string
}

export const PAY_METHODS: readonly PayMethodOption[] = [
  { id: 'pix', label: 'Pix', icon: '⚡' },
  { id: 'debito', label: 'Débito', icon: '💳' },
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { id: 'ted', label: 'TED/DOC', icon: '🏦' },
  { id: 'credito', label: 'Crédito', icon: '💜' },
  { id: 'boleto', label: 'Boleto', icon: '📋' },
]

const FALLBACK_ICON = '💳'
const FALLBACK_COLOR = '#64748b'

/** Cores neutras demais para fatias/barras do gráfico da Visão geral. */
const CHART_NEUTRAL = new Set(['#64748b', '#475569', '#94a3b8'])

const CHART_FALLBACK = [
  '#3b82f6',
  '#f97316',
  '#22c55e',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#d946ef',
  '#0891b2',
] as const

export function iconFor(category: string): string {
  return CATEGORY_ICONS[category] ?? FALLBACK_ICON
}

export function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR
}

/** Cor para gráficos — evita cinzas que somem no donut e nas barras. */
export function colorForChart(category: string, index = 0): string {
  const c = colorFor(category)
  if (CHART_NEUTRAL.has(c.toLowerCase())) {
    return CHART_FALLBACK[index % CHART_FALLBACK.length]
  }
  return c
}

/** Rótulo usado no donut da Visão geral para moradia + utilidades (legado). */
export const OVERVIEW_HOUSEHOLD_LABEL = 'contas de casa'

const HOUSEHOLD_CATEGORY_KEYS = new Set([
  'moradia',
  'aluguel',
  'condomínio',
  'condominio',
  'energia',
  'água',
  'agua',
  'internet',
  'gás',
  'gas',
  'celular',
  'telefone',
])

/** Agrupa energia, água, aluguel etc. em “contas de casa” no gráfico de categorias. */
export function groupCategoryForOverview(category: string): string {
  const key = category.trim().toLowerCase()
  if (HOUSEHOLD_CATEGORY_KEYS.has(key)) return OVERVIEW_HOUSEHOLD_LABEL
  return category
}

const MERCHANT_LABELS: [RegExp, string][] = [
  [/amazon/i, 'Amazon'],
  [/shopee/i, 'Shopee'],
  [/mercado\s*livre|mercadolivre/i, 'Mercado Livre'],
  [/magalu|magazine\s*luiza/i, 'Magalu'],
  [/shein/i, 'Shein'],
  [/aliexpress/i, 'AliExpress'],
  [/ifood/i, 'iFood'],
  [/uber\s*eats/i, 'Uber Eats'],
  [/netflix/i, 'Netflix'],
  [/spotify/i, 'Spotify'],
  [/disney/i, 'Disney+'],
  [/hbo|max\b/i, 'HBO Max'],
  [/decathlon/i, 'Decathlon'],
  [/pão\s*de\s*açúcar|pao\s*de\s*acucar/i, 'Pão de Açúcar'],
  [/carrefour/i, 'Carrefour'],
  [/americanas/i, 'Americanas'],
]

/** Nome curto da loja/serviço para enriquecer rótulos “outros” e “compras”. */
export function merchantHintFromDescription(desc: string): string | null {
  const d = (desc ?? '').trim()
  if (!d) return null
  for (const [re, label] of MERCHANT_LABELS) {
    if (re.test(d)) return label
  }
  const word = d.split(/\s+/)[0]?.replace(/[^\p{L}\d]/gu, '')
  if (!word || word.length < 3) return null
  if (/^(pix|pgto|pagamento|compra|debito|credito)$/i.test(word)) return null
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

const CATEGORY_HINT_KEYS = new Set(['outros', 'compras', OVERVIEW_HOUSEHOLD_LABEL])

/** Ex.: "outros (Amazon, Shopee)" quando houver compras identificáveis. */
export function formatCategoryLabel(category: string, hints: string[]): string {
  const key = category.trim().toLowerCase()
  if (!CATEGORY_HINT_KEYS.has(key) || hints.length === 0) return category
  const uniq = [...new Set(hints.map((h) => h.trim()).filter(Boolean))].slice(0, 3)
  if (!uniq.length) return category
  return `${category} (${uniq.join(', ')})`
}

type MerchantRule = {
  name: string
  category: string
  aliases: string[]
}

/** Marcas comuns + grafias faladas/digitadas com erro. */
const SMART_MERCHANTS: MerchantRule[] = [
  { name: "McDonald's", category: 'alimentação', aliases: ['mcdonalds', 'mc donalds', 'mc donald', 'mc donals', 'mcdonals', 'méqui', 'mequi'] },
  { name: 'Burger King', category: 'alimentação', aliases: ['burger king', 'burguer king', 'bk'] },
  { name: 'iFood', category: 'alimentação', aliases: ['ifood', 'i food', 'ai food'] },
  { name: 'Rappi', category: 'alimentação', aliases: ['rappi', 'rapi'] },
  { name: 'Outback', category: 'alimentação', aliases: ['outback', 'out bak'] },
  { name: 'Habib’s', category: 'alimentação', aliases: ['habibs', 'habib'] },
  { name: 'Starbucks', category: 'alimentação', aliases: ['starbucks', 'star bucks', 'starbuck'] },
  { name: 'Uber Eats', category: 'alimentação', aliases: ['uber eats', 'uber eat', 'ubereats'] },
  { name: 'Uber', category: 'transporte', aliases: ['uber', 'úber'] },
  { name: '99', category: 'transporte', aliases: ['99', 'noventa e nove'] },
  { name: 'Netflix', category: 'streaming', aliases: ['netflix', 'net flix', 'netiflix'] },
  { name: 'Spotify', category: 'streaming', aliases: ['spotify', 'spotfy', 'spotifi'] },
  { name: 'Disney+', category: 'streaming', aliases: ['disney plus', 'disney+', 'disnei'] },
  { name: 'Amazon Prime', category: 'streaming', aliases: ['amazon prime', 'prime video'] },
  { name: 'Carrefour', category: 'mercado', aliases: ['carrefour', 'carrefur', 'carrefou'] },
  { name: 'Pão de Açúcar', category: 'mercado', aliases: ['pão de açúcar', 'pao de acucar'] },
  { name: 'Assaí', category: 'mercado', aliases: ['assaí', 'assai atacadista', 'assai'] },
  { name: 'Atacadão', category: 'mercado', aliases: ['atacadão', 'atacadao'] },
  { name: 'Drogasil', category: 'saúde', aliases: ['drogasil', 'droga sil'] },
  { name: 'Droga Raia', category: 'saúde', aliases: ['droga raia', 'drogaraia'] },
  { name: 'Smart Fit', category: 'saúde', aliases: ['smart fit', 'smartfit', 'smart feet'] },
  { name: 'Renner', category: 'compras', aliases: ['renner', 'rener'] },
  { name: 'Shopee', category: 'compras', aliases: ['shopee', 'shopi', 'shope'] },
  { name: 'Mercado Livre', category: 'compras', aliases: ['mercado livre', 'mercadolivre'] },
  { name: 'Amazon', category: 'compras', aliases: ['amazon', 'amazom'] },
]

function normalizeSmartText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\d]+/gu, ' ')
    .trim()
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const old = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = old
    }
  }
  return prev[b.length]
}

function merchantCandidates(input: string): string[] {
  const words = normalizeSmartText(input).split(/\s+/).filter(Boolean)
  const candidates = new Set(words)
  for (let size = 2; size <= Math.min(3, words.length); size++) {
    for (let i = 0; i <= words.length - size; i++) {
      candidates.add(words.slice(i, i + size).join(''))
    }
  }
  return [...candidates]
}

function findSmartMerchant(desc: string): MerchantRule | null {
  const normalized = normalizeSmartText(desc)
  const compact = normalized.replace(/\s/g, '')
  const candidates = merchantCandidates(normalized)

  for (const merchant of SMART_MERCHANTS) {
    for (const rawAlias of merchant.aliases) {
      const alias = normalizeSmartText(rawAlias)
      const aliasCompact = alias.replace(/\s/g, '')
      if (normalized.includes(alias) || compact.includes(aliasCompact)) return merchant
      if (aliasCompact.length < 5) continue
      const tolerance = Math.min(2, Math.max(1, Math.floor(aliasCompact.length * 0.2)))
      if (
        candidates.some(
          (candidate) =>
            Math.abs(candidate.length - aliasCompact.length) <= tolerance &&
            editDistance(candidate, aliasCompact) <= tolerance,
        )
      ) {
        return merchant
      }
    }
  }
  return null
}

/** Corrige marcas conhecidas sem alterar descrições que não reconhecemos. */
export function normalizeMerchantName(desc: string): string {
  return findSmartMerchant(desc)?.name ?? desc.trim()
}

/** Infere a categoria a partir do nome/descrição (fallback quando não definida). */
export function inferCategory(desc: string | null | undefined, fallback = 'outros'): string {
  const raw = desc ?? ''
  const merchant = findSmartMerchant(raw)
  if (merchant) return merchant.category

  const d = normalizeSmartText(raw)
  if (/ifood|rappi|uber.?eat|delivery|restaurante|lanche|pizza|sushi|comida|padaria|cafe|café|açaí|acai|sorvete|doce|hamburguer|burger|coxinha|salgado|pastel|empada|esfiha|marmita|refeição|refeicao|lanchonete|açai/.test(d)) return 'alimentação'
  if (/mercado|supermercado|hortifruti|feira|sacolão|atacado/.test(d)) return 'mercado'
  if (/uber|99|taxi|combustivel|gasolina|estacionamento|pedágio|pedagio|passagem|ônibus|onibus|metrô|metro/.test(d)) return 'transporte'
  if (/netflix|spotify|disney|hbo|prime|youtube|streaming|deezer|globoplay|paramount|apple tv/.test(d)) return 'streaming'
  if (/farmacia|remedio|médico|medico|saude|saúde|hospital|exame|dentist|plano|unimed|amil/.test(d)) return 'saúde'
  if (/academia|gym|crossfit|smartfit/.test(d)) return 'saúde'
  if (/curso|faculdade|escola|livro|udemy|alura|dio|hotmart|educação|educacao/.test(d)) return 'educação'
  if (/hotel|airbnb|viagem|voo|aviao|avião|booking|decolar/.test(d)) return 'lazer'
  if (/kindle|macbook|iphone|samsung|notebook|celular|tablet|ps5|ps4|xbox|nintendo|switch|play|eletro|geladeira|fogão|fogao|ar.condicionado/.test(d)) return 'compras'
  if (/roupa|camiseta|calça|sapato|tênis|tenis|moda|zara|renner|c&a|hering/.test(d)) return 'compras'
  if (/pet|veterinario|veterinário|ração|racao/.test(d)) return 'outros'
  return fallback || 'outros'
}

/**
 * Resolve a categoria de exibição de um gasto: usa a categoria explícita quando
 * ela é significativa; senão, infere pelo nome. (Regra do `byCat` do legado.)
 */
export function resolveExpenseCategory(name: string, cat: string | null | undefined): string {
  if (cat && cat !== 'outros' && cat !== 'cartão') return cat
  return inferCategory(name, cat || 'outros')
}
