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

export const PREVIEW_TOUR_STEPS: Array<{ id: PreviewId; message: string }> = [
  {
    id: 'overview',
    message: 'Clique aqui para conhecer sua visão geral — receitas, gastos e saldo do mês.',
  },
  {
    id: 'transactions',
    message: 'Clique aqui para ver transações, categorias e o histórico completo.',
  },
  {
    id: 'cards',
    message: 'Clique aqui para explorar cartões, faturas e limites.',
  },
  {
    id: 'investments',
    message: 'Clique aqui para conhecer o investidor — B3, FIIs, ETFs e cripto.',
  },
  {
    id: 'community',
    message: 'Clique aqui para ver como a comunidade sugere e vota melhorias.',
  },
]

export const DEMO_TOUR_KEY = 'flux-landing-hint-demo'

export function readPreviewTourStep(): number | null {
  if (typeof sessionStorage === 'undefined') return 0
  if (sessionStorage.getItem(DEMO_TOUR_KEY) === '1') return null
  return 0
}

export function dismissPreviewTour() {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(DEMO_TOUR_KEY, '1')
}
