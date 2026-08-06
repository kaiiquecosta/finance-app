import { describe, expect, it } from 'vitest'
import { reais, type Cents } from '@/domain/money'
import type {
  BankAccount,
  Card,
  CardBill,
  FixedBill,
  Subscription,
  Transaction,
} from '@/domain/entities'
import {
  accountBalance,
  annualByMonth,
  annualSummary,
  consolidatedBalance,
  expenseByCategory,
  fixedBillsTotal,
  futureValue,
  investmentAverages,
  monthlyPotential,
  summarizeTransactions,
  topCategory,
} from './overview'

let seq = 0
function tx(p: Partial<Transaction> & { amt: Cents; date: string }): Transaction {
  return { id: ++seq, name: 'x', cat: 'outros', accountId: null, ...p }
}
function acc(id: number, initial: Cents): BankAccount {
  return { id, name: `Conta ${id}`, color: '#000', accountType: 'corrente', initialBalance: initial }
}
function cardWith(bills: Array<Partial<CardBill>>): Card {
  return {
    id: 1,
    name: 'Card',
    color: '#000',
    limit: reais(9999),
    closeDay: 31,
    dueDay: 10,
    type: 'credito',
    bills: bills.map((b, i) => ({
      id: i + 1,
      cardId: 1,
      description: 'compra',
      amt: reais(0),
      date: '2026-01-01',
      pastPaid: false,
      recurring: false,
      ...b,
    })),
  }
}
function sub(amt: Cents, day = 10): Subscription {
  return { id: 1, name: 'Netflix', amt, day, icon: '🎬', color: '#000' }
}
function fb(amt: Cents): FixedBill {
  return { id: 1, name: 'Aluguel', amt, dueDay: 10, icon: '🏠', color: '#000', category: 'moradia', paid: false }
}

describe('saldo de contas', () => {
  const txs = [
    tx({ accountId: 1, amt: reais(200), date: '2026-01-01' }),
    tx({ accountId: 1, amt: reais(-50), date: '2026-01-02' }),
    tx({ accountId: 2, amt: reais(-999), date: '2026-01-02' }),
  ]
  it('saldo = inicial + transações da conta', () => {
    expect(accountBalance(acc(1, reais(1000)), txs)).toBe(115000)
  })
  it('consolidado soma as contas', () => {
    expect(consolidatedBalance([acc(1, reais(1000)), acc(2, reais(500))], txs)).toBe(65100)
  })
})

describe('summarizeTransactions', () => {
  it('receita, gasto e saldo', () => {
    const s = summarizeTransactions([
      tx({ amt: reais(3000), date: '2026-01-01' }),
      tx({ amt: reais(-500), date: '2026-01-02' }),
      tx({ amt: reais(-200), date: '2026-01-03' }),
    ])
    expect(s).toEqual({ income: 300000, spent: 70000, balance: 230000 })
  })
})

describe('expenseByCategory / topCategory', () => {
  const txs = [
    tx({ name: 'Netflix', cat: 'outros', amt: reais(-26.9), date: '2026-01-05' }),
    tx({ name: 'Pagamento fatura', cat: 'cartão', billId: 5, amt: reais(-1000), date: '2026-01-10' }),
    tx({ name: 'Compra', cat: 'mercado', amt: reais(-150), date: '2026-01-02' }),
  ]
  const card = cardWith([{ description: 'Loja Y', amt: reais(100), date: '2026-01-03' }])
  const result = expenseByCategory(txs, [card], 0, 2026)
  const byCat = result.amounts

  it('agrega gastos e ignora pagamento de fatura', () => {
    expect(byCat).toEqual({ streaming: 2690, mercado: 15000, compras: 10000 })
  })
  it('maior categoria', () => {
    expect(topCategory(byCat)).toEqual({ category: 'mercado', amount: 15000 })
    expect(topCategory({})).toBeNull()
  })
  it('agrupa energia e água em contas de casa', () => {
    const util = expenseByCategory(
      [
        tx({ amt: reais(-100), date: '2026-08-05', cat: 'energia', name: 'Energia' }),
        tx({ amt: reais(-50), date: '2026-08-06', cat: 'água', name: 'Água' }),
      ],
      [],
      7,
      2026,
    ).amounts
    expect(util['contas de casa']).toBe(15000)
    expect(util.energia).toBeUndefined()
  })
})

describe('visão anual', () => {
  const txs = [
    tx({ amt: reais(3000), date: '2026-01-05' }),
    tx({ amt: reais(-500), date: '2026-01-10' }),
    tx({ amt: reais(-200), date: '2026-02-10' }),
  ]
  const card = cardWith([{ amt: reais(100), date: '2026-01-03' }])
  const months = annualByMonth(2026, txs, [card], [sub(reais(30))])

  it('agrega tx + fatura + assinatura por mês', () => {
    expect(months[0]).toEqual({ income: 300000, spent: 63000 }) // 500 + 100(fatura) + 30(assinatura)
    expect(months[1]).toEqual({ income: 0, spent: 23000 }) // 200 + 30
    expect(months[2]).toEqual({ income: 0, spent: 3000 }) // só assinatura
  })
  it('resumo anual', () => {
    const s = annualSummary(months)
    expect(s.totalIncome).toBe(300000)
    expect(s.totalSpent).toBe(116000) // 63000 + 23000 + 30000 (10 meses × 30)
    expect(s.balance).toBe(184000)
    expect(s.monthsWithData).toBe(12) // assinatura toca todos os meses
  })
})

describe('potencial de investimento', () => {
  const txs = [
    tx({ amt: reais(3000), date: '2026-01-05' }),
    tx({ amt: reais(-500), date: '2026-01-10' }),
    tx({ amt: reais(-200), date: '2026-02-10' }),
  ]
  it('médias mensais (só meses com movimento)', () => {
    expect(investmentAverages(2026, txs)).toEqual({ avgIncome: 150000, avgSpent: 35000 })
  })
  it('fixedBillsTotal soma todas (corrige bug do `fixed`)', () => {
    expect(fixedBillsTotal([fb(reais(560)), fb(reais(200))])).toBe(76000)
  })
  it('sobra mensal, nunca negativa', () => {
    expect(monthlyPotential(reais(1500) as Cents, reais(350) as Cents, reais(760) as Cents)).toBe(74000)
    expect(monthlyPotential(reais(100) as Cents, reais(200) as Cents, reais(0) as Cents)).toBe(0)
    expect(monthlyPotential(reais(6800) as Cents, reais(2393.24) as Cents, reais(4761.1) as Cents)).toBe(
      203890,
    )
  })
  it('valor futuro de aportes (juros compostos)', () => {
    expect(futureValue(reais(100), 12, 0)).toBe(120000) // sem juros = soma
    expect(futureValue(reais(100), 12, 0.008)).toBeGreaterThan(120000) // com juros > soma
  })
})
