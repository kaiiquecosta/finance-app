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
    message: 'Clique aqui para conhecer receitas, gastos e saldo do mês.',
  },
  {
    id: 'transactions',
    short: 'Transações',
    message: 'Clique aqui para ver lançamentos, categorias e histórico.',
  },
  {
    id: 'cards',
    short: 'Cartões',
    message: 'Clique aqui para explorar faturas, limites e parcelas.',
  },
  {
    id: 'investments',
    short: 'Investimentos',
    message: 'Clique aqui para conhecer B3, FIIs, ETFs e cripto ao vivo.',
  },
  {
    id: 'community',
    short: 'Comunidade',
    message: 'Clique aqui para ver sugestões, votos e o roadmap aberto.',
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
