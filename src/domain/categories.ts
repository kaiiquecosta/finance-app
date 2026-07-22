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
  outros: '#64748b',
  cartão: '#94a3b8',
  banco: '#60a5fa',
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

export function iconFor(category: string): string {
  return CATEGORY_ICONS[category] ?? FALLBACK_ICON
}

export function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR
}

/** Infere a categoria a partir do nome/descrição (fallback quando não definida). */
export function inferCategory(desc: string | null | undefined, fallback = 'outros'): string {
  const d = (desc ?? '').toLowerCase()
  if (/ifood|rappi|uber.?eat|delivery|restaurante|lanche|pizza|sushi|comida|padaria|cafe|café|açaí|acai|sorvete|doce|hamburguer|burger/.test(d)) return 'alimentação'
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
