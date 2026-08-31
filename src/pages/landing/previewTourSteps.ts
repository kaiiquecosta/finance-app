export type PreviewId =
  | 'overview'
  | 'transactions'
  | 'cards'
  | 'installments'
  | 'subscriptions'
  | 'bills'
  | 'goals'
  | 'investments'
  | 'community'

export const PREVIEW_TOUR_STEPS: Array<{ id: PreviewId; message: string; short: string }> = [
  {
    id: 'overview',
    short: 'Visão geral',
    message: 'Toque nesta aba para ver receitas, gastos e saldo do mês em um só lugar.',
  },
  {
    id: 'transactions',
    short: 'Transações',
    message: 'Aqui ficam lançamentos, categorias e o histórico completo do mês.',
  },
  {
    id: 'cards',
    short: 'Cartões',
    message: 'Explore faturas, limites e lançamentos de cada cartão de crédito.',
  },
  {
    id: 'investments',
    short: 'Investimentos',
    message: 'Conheça B3, FIIs, ETFs e cripto com cotações em tempo real.',
  },
  {
    id: 'community',
    short: 'Comunidade',
    message: 'Veja sugestões, votos e o roadmap aberto construído com os usuários.',
  },
]

/** v3 — chave nova para não herdar dismiss do card antigo */
export const DEMO_TOUR_KEY = 'flux-landing-tab-tour-v3'

export function isPreviewTourDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(DEMO_TOUR_KEY) === '1'
}

export function dismissPreviewTour() {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(DEMO_TOUR_KEY, '1')
}
