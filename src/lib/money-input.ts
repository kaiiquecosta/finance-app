/**
 * Máscara de entrada monetária no estilo bancário: o usuário digita apenas
 * dígitos e o valor preenche da direita para a esquerda (centavos primeiro).
 * "1234" → "12,34". Retorna sempre string formatada em pt-BR.
 */
import { cents, formatBRL, type Cents } from '@/domain/money'

/** Converte a string digitada (só dígitos importam) em `Cents`. */
export function digitsToCents(input: string): Cents {
  const digits = input.replace(/\D/g, '')
  if (!digits) return cents(0)
  return cents(Number(digits))
}

/** Formata o que foi digitado como valor BR sem o símbolo (ex.: "1.234,56"). */
export function maskMoney(input: string): string {
  const value = digitsToCents(input)
  return (value / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Valor em `Cents` formatado para preencher o input (sem "R$"). */
export function centsToInput(value: Cents): string {
  return (value / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export { formatBRL }
