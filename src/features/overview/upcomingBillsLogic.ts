/** Janela de exibição: apenas o próximo mês civil (não o atual nem meses seguintes). */
export function nextMonthWindow(asOf: Date): { year: number; month: number; label: string } {
  const d = new Date(asOf.getFullYear(), asOf.getMonth() + 1, 1)
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    label: label.charAt(0).toUpperCase() + label.slice(1),
  }
}
