import { describe, expect, it } from 'vitest'
import { reais } from '@/domain/money'
import type { Income } from '@/domain/entities'
import {
  monthlyExpected,
  pendingAutoReceiptKeys,
  receiptKey,
  receiptStatus,
  receiptTransactionDraft,
  receivedDays,
  totalMonthlyExpected,
  totalReceived,
} from './income'

function income(p: Partial<Income> = {}): Income {
  return {
    id: 7,
    name: 'Salário',
    amt: reais(1000),
    freq: 'mensal',
    icon: '💵',
    color: '#22c55e',
    accountId: 3,
    days: [5],
    received: [],
    auto: true,
    ...p,
  }
}

const MARCH_15 = new Date(2026, 2, 15)

describe('previsão mensal', () => {
  it('aplica multiplicador por frequência', () => {
    expect(monthlyExpected(income({ freq: 'mensal', amt: reais(3000) }))).toBe(300000)
    expect(monthlyExpected(income({ freq: 'quinzenal', amt: reais(1000) }))).toBe(200000)
    expect(monthlyExpected(income({ freq: 'semanal', amt: reais(500) }))).toBe(200000)
    expect(monthlyExpected(income({ freq: 'variavel', amt: reais(999) }))).toBe(0)
  })
  it('totaliza várias rendas', () => {
    expect(
      totalMonthlyExpected([
        income({ freq: 'mensal', amt: reais(3000) }),
        income({ freq: 'semanal', amt: reais(250) }),
      ]),
    ).toBe(400000)
  })
})

describe('recebimentos do mês', () => {
  it('receiptKey formata o dia', () => {
    expect(receiptKey('2026-03', 5)).toBe('2026-03-05')
  })
  it('dias recebidos e total', () => {
    const inc = income({ days: [5, 20], received: ['2026-03-05'] })
    expect(receivedDays(inc, MARCH_15)).toEqual([5])
    expect(totalReceived([inc], MARCH_15)).toBe(100000) // 1 recebimento × R$1000
  })
  it('status none/partial/full', () => {
    expect(receiptStatus(income({ days: [5, 20], received: [] }), MARCH_15)).toBe('none')
    expect(receiptStatus(income({ days: [5, 20], received: ['2026-03-05'] }), MARCH_15)).toBe('partial')
    expect(
      receiptStatus(income({ days: [5, 20], received: ['2026-03-05', '2026-03-20'] }), MARCH_15),
    ).toBe('full')
  })
})

describe('auto-recebimento', () => {
  it('marca dias já vencidos e ainda não recebidos', () => {
    const inc = income({ days: [5, 20], received: [] })
    // dia 15: dia 5 já passou → pendente; dia 20 ainda não
    expect(pendingAutoReceiptKeys(inc, MARCH_15)).toEqual(['2026-03-05'])
  })
  it('não repete os já marcados', () => {
    const inc = income({ days: [5], received: ['2026-03-05'] })
    expect(pendingAutoReceiptKeys(inc, MARCH_15)).toEqual([])
  })
  it('gera rascunho de transação de receita', () => {
    const draft = receiptTransactionDraft(income({ id: 7, accountId: 3 }), '2026-03-05')
    expect(draft).toMatchObject({
      name: 'Salário',
      cat: 'receita',
      amt: 100000,
      date: '2026-03-05',
      incomeKey: '2026-03-05_7',
      accountId: 3,
    })
  })
})
