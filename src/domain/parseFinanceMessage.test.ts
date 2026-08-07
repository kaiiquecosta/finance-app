import { describe, expect, it } from 'vitest'
import { parseFinanceMessage } from './parseFinanceMessage'

describe('parseFinanceMessage', () => {
  it('interpreta 10 reais coxinha', () => {
    const r = parseFinanceMessage('10 reais coxinha')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.kind).toBe('expense')
    expect(r.data.amount).toBe(1000)
    expect(r.data.name.toLowerCase()).toContain('coxinha')
    expect(r.data.cat).toBe('alimentação')
  })

  it('interpreta dez reais coxinha (por extenso)', () => {
    const r = parseFinanceMessage('dez reais coxinha')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.amount).toBe(1000)
  })

  it('interpreta coxinha 10', () => {
    const r = parseFinanceMessage('coxinha 10')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.amount).toBe(1000)
    expect(r.data.cat).toBe('alimentação')
  })

  it('interpreta gastei no uber', () => {
    const r = parseFinanceMessage('gastei 45 uber')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.amount).toBe(4500)
    expect(r.data.cat).toBe('transporte')
  })

  it('interpreta receita', () => {
    const r = parseFinanceMessage('recebi 3000 freelance')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.kind).toBe('income')
    expect(r.data.amount).toBe(300000)
    expect(r.data.cat).toBe('receita')
  })

  it('interpreta inglês: I just spent R$10 on Coxinha', () => {
    const r = parseFinanceMessage('I just spent R$10 on Coxinha')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.kind).toBe('expense')
    expect(r.data.amount).toBe(1000)
    expect(r.data.name).toBe('Coxinha')
    expect(r.data.cat).toBe('alimentação')
  })

  it('interpreta inglês: I just earned R$500 and throw it', () => {
    const r = parseFinanceMessage('I just earned R$500 and throw it')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.kind).toBe('income')
    expect(r.data.amount).toBe(50000)
    expect(r.data.cat).toBe('receita')
  })

  it('interpreta acabei de gastar com coxinha', () => {
    const r = parseFinanceMessage('acabei de gastar 10 reais com coxinha')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.kind).toBe('expense')
    expect(r.data.amount).toBe(1000)
    expect(r.data.name.toLowerCase()).toContain('coxinha')
  })

  it('corrige marca digitada errado e categoriza', () => {
    const r = parseFinanceMessage('25 reais mc donals')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.name).toBe("McDonald's")
    expect(r.data.cat).toBe('alimentação')
  })
})
