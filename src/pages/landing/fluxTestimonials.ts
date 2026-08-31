export type FluxTestimonial = {
  quote: string
  name: string
  role: string
  initials: string
  accent: string
}

export const FLUX_TESTIMONIALS: FluxTestimonial[] = [
  {
    quote:
      'Parei de usar planilha. Cartão, conta fixa e investimento num lugar só — e consigo ver o mês em dois minutos.',
    name: 'Rafael M.',
    role: 'Usuário Pro · Curitiba',
    initials: 'RM',
    accent: '#2563eb',
  },
  {
    quote:
      'O investidor com cotação ao vivo substituiu três apps que eu pagava. FIIs e ações B3 na mesma tela.',
    name: 'Camila T.',
    role: 'Investidora · Rio de Janeiro',
    initials: 'CT',
    accent: '#820ad1',
  },
  {
    quote: 'Importar OFX do Nubank e ver a fatura bater com o limite do cartão mudou minha rotina.',
    name: 'Pedro H.',
    role: 'Usuário Pro · Belo Horizonte',
    initials: 'PH',
    accent: '#0891b2',
  },
  {
    quote:
      'Metas com prazo e barra de progresso me deram clareza pra viagem. Deposito todo mês sem pensar.',
    name: 'Juliana F.',
    role: 'Usuária Pro · Florianópolis',
    initials: 'JF',
    accent: '#16a34a',
  },
  {
    quote:
      'Registro gasto falando com o assistente no celular. Parece mágica, mas é só o Flux entendendo português.',
    name: 'Lucas A.',
    role: 'Early adopter · São Paulo',
    initials: 'LA',
    accent: '#d97706',
  },
  {
    quote:
      'A comunidade é diferencial — votei numa ideia e vi entrar no roadmap. Transparência que app grande não tem.',
    name: 'Beatriz N.',
    role: 'Usuária beta · Porto Alegre',
    initials: 'BN',
    accent: '#7c3aed',
  },
  {
    quote: 'Interface limpa, sem ruído. Parece produto Apple, mas é finanças de verdade no Brasil.',
    name: 'André K.',
    role: 'Designer · Recife',
    initials: 'AK',
    accent: '#6366f1',
  },
  {
    quote: '30 dias grátis sem cartão me convenceu a testar. Em uma semana já tinha tudo migrado.',
    name: 'Fernanda L.',
    role: 'Usuária Pro · Brasília',
    initials: 'FL',
    accent: '#db2777',
  },
  {
    quote:
      'Parcelas do cartão aparecem certinho. Antes eu perdia controle do que ainda vinha na fatura.',
    name: 'Marcos V.',
    role: 'Usuário Pro · Campinas',
    initials: 'MV',
    accent: '#0d9488',
  },
]

/** Reparte em 3 colunas para o marquee (estilo Pora). */
export function testimonialColumns(): FluxTestimonial[][] {
  const cols: FluxTestimonial[][] = [[], [], []]
  FLUX_TESTIMONIALS.forEach((item, i) => {
    cols[i % 3].push(item)
  })
  return cols
}
