export interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

/** Itens de navegação do app (usados na topnav e na bottom nav). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Visão geral', icon: '📊', end: true },
  { to: '/app/transacoes', label: 'Transações', icon: '💸' },
  { to: '/app/cartoes', label: 'Cartões', icon: '💳' },
  { to: '/app/parcelas', label: 'Parcelas', icon: '🔁' },
  { to: '/app/assinaturas', label: 'Assinaturas', icon: '🔄' },
  { to: '/app/contas', label: 'Contas', icon: '🏠' },
  { to: '/app/metas', label: 'Metas', icon: '🎯' },
  { to: '/app/investimentos', label: 'Investimentos', icon: '📈' },
]
