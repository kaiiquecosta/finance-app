/**
 * Depoimentos exibidos na landing.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REGRA: só entra depoimento REAL, de pessoa REAL, que autorizou o uso.
 *
 * Não invente pessoas, não gere quotes plausíveis e não reaproveite relatos de
 * usuários de outros produtos. Depoimento fabricado em página que vende
 * assinatura é publicidade enganosa (CDC art. 37 e §1º) e infringe o Código do
 * CONAR — além de ser o tipo de coisa que, descoberta, destrói justamente a
 * confiança que a seção existe para construir. Num app de finanças, onde a
 * pessoa entrega a própria vida financeira, o custo é ainda maior.
 *
 * Enquanto a lista estiver vazia a seção não é renderizada: a landing
 * simplesmente não mostra o bloco, sem espaço vazio e sem placeholder.
 *
 * Para cada entrada, preencha `source` com o link de onde o relato saiu
 * (tweet, review na loja, e-mail autorizado). É o que permite conferir depois
 * que aquilo foi realmente dito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface Testimonial {
  /** Nome como a pessoa quer ser identificada. */
  readonly name: string
  /** @usuario, sem o @. Opcional. */
  readonly handle?: string
  /** O relato, nas palavras da pessoa. Não editar o sentido. */
  readonly quote: string
  /** Link público do relato ou registro da autorização. Obrigatório na prática. */
  readonly source: string
}

/** Vazio de propósito — ver a regra acima. */
export const TESTIMONIALS: readonly Testimonial[] = []

/** "Ana Paula Souza" → "AS" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * Tom do avatar derivado do nome, para a mesma pessoa manter sempre a mesma cor
 * entre renders (e entre sessões) sem precisar guardar nada.
 */
export function avatarTone(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997
  return h % 4
}
