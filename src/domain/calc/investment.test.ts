import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import {
  calcInvestment,
  daysHeld,
  fixedIncomeIR,
  grossRateFor,
  irFor,
  type MarketRates,
} from './investment'

const RATES: MarketRates = { cdi: 0.1365, ipca: 0.045 }
// 2025 não é bissexto → exatamente 365 dias => 1 ano.
const START = '2025-01-01'
const ONE_YEAR_LATER = new Date(2026, 0, 1)

describe('daysHeld', () => {
  it('conta dias corridos', () => {
    expect(daysHeld(START, ONE_YEAR_LATER)).toBe(365)
  })
  it('mesmo dia = 0', () => {
    expect(daysHeld('2026-01-01', new Date(2026, 0, 1))).toBe(0)
  })
  it('data futura = 0 (nunca negativo)', () => {
    expect(daysHeld('2027-01-01', ONE_YEAR_LATER)).toBe(0)
  })
})

describe('fixedIncomeIR — tabela regressiva', () => {
  it('faixas por prazo', () => {
    expect(fixedIncomeIR(180)).toBe(0.225)
    expect(fixedIncomeIR(181)).toBe(0.2)
    expect(fixedIncomeIR(360)).toBe(0.2)
    expect(fixedIncomeIR(361)).toBe(0.175)
    expect(fixedIncomeIR(720)).toBe(0.175)
    expect(fixedIncomeIR(721)).toBe(0.15)
  })
})

describe('grossRateFor', () => {
  it('CDB/LCI/Selic usam % do CDI', () => {
    expect(grossRateFor({ type: 'cdb', pct: 100 }, 1, RATES)).toBeCloseTo(0.1365, 10)
    expect(grossRateFor({ type: 'cdb', pct: 110 }, 1, RATES)).toBeCloseTo(0.15015, 10)
    // pct ausente assume 100%
    expect(grossRateFor({ type: 'lci' }, 1, RATES)).toBeCloseTo(0.1365, 10)
  })
  it('IPCA+ soma spread', () => {
    expect(grossRateFor({ type: 'ipca', spread: 5 }, 1, RATES)).toBeCloseTo(0.095, 10)
  })
  it('poupança = 70% do CDI quando > 8,5%', () => {
    expect(grossRateFor({ type: 'poupanca' }, 1, RATES)).toBeCloseTo(0.7 * 0.1365, 10)
  })
  it('renda variável usa yield informado (default 10%)', () => {
    expect(grossRateFor({ type: 'acoes', yield: 20 }, 1, RATES)).toBeCloseTo(0.2, 10)
    expect(grossRateFor({ type: 'cripto' }, 1, RATES)).toBeCloseTo(0.1, 10)
  })
})

describe('irFor', () => {
  it('isentos', () => {
    expect(irFor('lci', 365, reais(100))).toBe(0)
    expect(irFor('poupanca', 365, reais(100))).toBe(0)
    expect(irFor('fii', 365, reais(100))).toBe(0)
  })
  it('renda variável = 15% se houver lucro', () => {
    expect(irFor('acoes', 365, reais(100))).toBe(0.15)
    expect(irFor('cripto', 365, reais(0))).toBe(0)
  })
  it('renda fixa segue a tabela regressiva', () => {
    expect(irFor('cdb', 100, reais(100))).toBe(0.225)
    expect(irFor('ipca', 800, reais(100))).toBe(0.15)
  })
})

describe('calcInvestment — cenários de 1 ano', () => {
  it('CDB 100% CDI (renda fixa, IR 17,5% em 365 dias)', () => {
    const r = calcInvestment({ amount: reais(1000), type: 'cdb', pct: 100, date: START }, ONE_YEAR_LATER, RATES)
    expect(r.days).toBe(365)
    expect(r.grossRate).toBeCloseTo(0.1365, 10)
    expect(r.grossYield).toBe(13650) // R$ 136,50
    expect(r.ir).toBe(0.175)
    expect(r.netYield).toBe(11261) // 13650 * 0,825 = 11261,25 → 11261
    expect(r.grossAmount).toBe(113650)
    expect(r.netAmount).toBe(111261)
  })

  it('LCI isenta de IR', () => {
    const r = calcInvestment({ amount: reais(1000), type: 'lci', pct: 100, date: START }, ONE_YEAR_LATER, RATES)
    expect(r.ir).toBe(0)
    expect(r.grossYield).toBe(13650)
    expect(r.netYield).toBe(13650)
  })

  it('ações com yield padrão (10%) e IR 15%', () => {
    const r = calcInvestment({ amount: reais(1000), type: 'acoes', date: START }, ONE_YEAR_LATER, RATES)
    expect(r.grossYield).toBe(10000)
    expect(r.ir).toBe(0.15)
    expect(r.netYield).toBe(8500)
  })

  it('investimento com data futura não rende', () => {
    const r = calcInvestment({ amount: reais(1000), type: 'cdb', date: '2030-01-01' }, ONE_YEAR_LATER, RATES)
    expect(r.days).toBe(0)
    expect(r.grossYield).toBe(0)
    expect(r.netYield).toBe(0)
    expect(r.grossAmount).toBe(100000)
  })

  it('usa DEFAULT_RATES quando não informado', () => {
    const r = calcInvestment({ amount: reais(1000), type: 'cdb', pct: 100, date: START }, ONE_YEAR_LATER)
    expect(r.grossYield).toBe(13650)
  })
})
