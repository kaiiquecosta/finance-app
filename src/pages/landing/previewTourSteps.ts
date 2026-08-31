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

export type PreviewTourStep =
  | { kind: 'tab'; id: PreviewId; message: string; short: string }
  | { kind: 'explore'; message: string; short: string }

export const PREVIEW_TOUR_STEPS: PreviewTourStep[] = [
  {
    kind: 'tab',
    id: 'overview',
    short: 'Visão geral',
    message: 'Toque nesta aba para ver receitas, gastos e saldo do mês em um só lugar.',
  },
  {
    kind: 'tab',
    id: 'transactions',
    short: 'Transações',
    message: 'Aqui ficam lançamentos, categorias e o histórico completo do mês.',
  },
  {
    kind: 'tab',
    id: 'cards',
    short: 'Cartões',
    message: 'Explore faturas, limites e lançamentos de cada cartão de crédito.',
  },
  {
    kind: 'tab',
    id: 'investments',
    short: 'Investimentos',
    message: 'Conheça B3, FIIs, ETFs e cripto com cotações em tempo real.',
  },
  {
    kind: 'tab',
    id: 'community',
    short: 'Comunidade',
    message: 'Veja sugestões, votos e o roadmap aberto construído com os usuários.',
  },
  {
    kind: 'explore',
    short: 'Sua vez',
    message: 'Agora explore por conta — clique nas abas, arraste o scroll e descubra cada tela do Flux no seu ritmo.',
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
