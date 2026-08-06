import { describe, expect, it } from 'vitest'
import { colorFor, formatCategoryLabel, iconFor, inferCategory, resolveExpenseCategory } from './categories'

describe('inferCategory', () => {
  it('reconhece por palavras-chave', () => {
    expect(inferCategory('iFood pedido')).toBe('alimentação')
    expect(inferCategory('Uber Eats')).toBe('alimentação') // "uber eat" tem prioridade sobre transporte
    expect(inferCategory('Uber viagem')).toBe('transporte')
    expect(inferCategory('Netflix')).toBe('streaming')
    expect(inferCategory('Academia Smart Fit')).toBe('saúde')
    expect(inferCategory('Curso Udemy')).toBe('educação')
    expect(inferCategory('Hotel Booking')).toBe('lazer')
    expect(inferCategory('iPhone 15 Pro')).toBe('compras')
    expect(inferCategory('Camiseta Renner')).toBe('compras')
  })
  it('usa fallback quando não reconhece', () => {
    expect(inferCategory('xyz qualquer')).toBe('outros')
    expect(inferCategory('', 'moradia')).toBe('moradia')
    expect(inferCategory(null)).toBe('outros')
  })
  it('LIMITAÇÃO herdada do legado: acento em keyword não casa (ex.: "farmacia")', () => {
    // A regex usa "farmacia" sem acento → "Farmácia" não é reconhecida como saúde.
    // Preservado por fidelidade; candidato a normalizar acentos numa melhoria futura.
    expect(inferCategory('Farmácia São João')).toBe('outros')
  })
})

describe('resolveExpenseCategory', () => {
  it('mantém a categoria explícita significativa', () => {
    expect(resolveExpenseCategory('Compras do mês', 'mercado')).toBe('mercado')
  })
  it('infere quando a categoria é genérica', () => {
    expect(resolveExpenseCategory('Netflix', 'outros')).toBe('streaming')
    expect(resolveExpenseCategory('Spotify', null)).toBe('streaming')
  })
})

describe('iconFor / colorFor', () => {
  it('retorna ícone/cor da categoria', () => {
    expect(iconFor('mercado')).toBe('🛒')
    expect(colorFor('netflix')).toBe('#e50914')
  })
  it('cai no fallback para categoria desconhecida', () => {
    expect(iconFor('inexistente')).toBe('💳')
    expect(colorFor('inexistente')).toBe('#64748b')
  })
})

describe('formatCategoryLabel', () => {
  it('enriquece outros e compras com lojas', () => {
    expect(formatCategoryLabel('outros', ['Amazon', 'Shopee'])).toBe('outros (Amazon, Shopee)')
    expect(formatCategoryLabel('compras', ['Decathlon'])).toBe('compras (Decathlon)')
    expect(formatCategoryLabel('mercado', ['Pão de Açúcar'])).toBe('mercado')
  })
})
