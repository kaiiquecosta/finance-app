/**
 * Persona fictícia completa — perfil CLT + freelance, SP, agosto/2026.
 * Usada em VITE_DEMO_PERSONA, mocks E2E e script SQL de seed.
 */
import type { FinanceData } from '@/data/api'
import { reais } from '@/domain/money'
import type {
  BankAccount,
  Card,
  CardBill,
  FixedBill,
  Goal,
  Income,
  Installment,
  Investment,
  Subscription,
  Transaction,
} from '@/domain/entities'

const R = reais

export const MARIANA_DEMO_IDS = {
  accountNubank: 7101,
  accountItau: 7102,
  accountPoupanca: 7103,
  cardNubank: 7201,
  cardItau: 7202,
} as const

function tx(
  id: number,
  name: string,
  cat: string,
  amtReais: number,
  date: string,
  accountId?: number,
): Transaction {
  return {
    id,
    name,
    cat,
    amt: R(amtReais),
    date,
    accountId: accountId ?? MARIANA_DEMO_IDS.accountNubank,
  }
}

function nubankBills(): CardBill[] {
  return [
    {
      id: 7301,
      cardId: MARIANA_DEMO_IDS.cardNubank,
      description: 'Supermercado Pão de Açúcar',
      amt: R(487.32),
      date: '2026-08-02',
      pastPaid: false,
      recurring: false,
    },
    {
      id: 7302,
      cardId: MARIANA_DEMO_IDS.cardNubank,
      description: 'Uber / 99',
      amt: R(156.4),
      date: '2026-08-04',
      pastPaid: false,
      recurring: false,
    },
    {
      id: 7303,
      cardId: MARIANA_DEMO_IDS.cardNubank,
      description: 'Farmácia Drogasil',
      amt: R(89.9),
      date: '2026-08-05',
      pastPaid: false,
      recurring: false,
    },
    {
      id: 7304,
      cardId: MARIANA_DEMO_IDS.cardNubank,
      description: 'Amazon BR',
      amt: R(234.5),
      date: '2026-07-28',
      pastPaid: false,
      recurring: false,
    },
    {
      id: 7305,
      cardId: MARIANA_DEMO_IDS.cardNubank,
      description: 'Posto Shell',
      amt: R(320),
      date: '2026-07-15',
      pastPaid: true,
      recurring: false,
    },
  ]
}

function itauBills(): CardBill[] {
  return [
    {
      id: 7311,
      cardId: MARIANA_DEMO_IDS.cardItau,
      description: 'Restaurante Outback',
      amt: R(198),
      date: '2026-08-01',
      pastPaid: false,
      recurring: false,
    },
    {
      id: 7312,
      cardId: MARIANA_DEMO_IDS.cardItau,
      description: 'Decathlon',
      amt: R(449.99),
      date: '2026-07-22',
      pastPaid: false,
      recurring: false,
    },
  ]
}

/** Dados de domínio prontos para a UI. */
export function buildMarianaFinanceData(): FinanceData {
  const bankAccounts: BankAccount[] = [
    {
      id: MARIANA_DEMO_IDS.accountNubank,
      name: 'Nubank — conta corrente',
      color: '#8b5cf6',
      accountType: 'corrente',
      initialBalance: R(3842.17),
    },
    {
      id: MARIANA_DEMO_IDS.accountItau,
      name: 'Itaú — salário',
      color: '#f97316',
      accountType: 'corrente',
      initialBalance: R(1250),
    },
    {
      id: MARIANA_DEMO_IDS.accountPoupanca,
      name: 'Poupança reserva',
      color: '#22c55e',
      accountType: 'poupanca',
      initialBalance: R(8500),
    },
  ]

  const cards: Card[] = [
    {
      id: MARIANA_DEMO_IDS.cardNubank,
      name: 'Nubank',
      color: '#8b5cf6',
      limit: R(8500),
      closeDay: 10,
      dueDay: 17,
      type: 'credito',
      bills: nubankBills(),
    },
    {
      id: MARIANA_DEMO_IDS.cardItau,
      name: 'Itaú Click',
      color: '#f97316',
      limit: R(12000),
      closeDay: 5,
      dueDay: 12,
      type: 'credito',
      bills: itauBills(),
    },
  ]

  const fixedBills: FixedBill[] = [
    {
      id: 7401,
      name: 'Aluguel',
      amt: R(2200),
      dueDay: 5,
      icon: '🏠',
      color: '#3b82f6',
      category: 'Moradia',
      paid: true,
      paidAt: '2026-08-05',
      paidAmount: R(2200),
    },
    {
      id: 7402,
      name: 'Condomínio',
      amt: R(680),
      dueDay: 10,
      icon: '🏢',
      color: '#6366f1',
      category: 'Moradia',
      paid: false,
      paidAt: null,
      paidAmount: null,
    },
    {
      id: 7403,
      name: 'Energia (Enel)',
      amt: R(187.44),
      dueDay: 12,
      icon: '⚡',
      color: '#eab308',
      category: 'Moradia',
      paid: false,
      paidAt: null,
      paidAmount: null,
    },
    {
      id: 7404,
      name: 'Água (Sabesp)',
      amt: R(92.3),
      dueDay: 15,
      icon: '💧',
      color: '#06b6d4',
      category: 'Moradia',
      paid: false,
      paidAt: null,
      paidAmount: null,
    },
    {
      id: 7405,
      name: 'Internet Vivo Fibra',
      amt: R(129.99),
      dueDay: 8,
      icon: '📶',
      color: '#a855f7',
      category: 'Moradia',
      paid: true,
      paidAt: '2026-08-07',
      paidAmount: R(129.99),
    },
    {
      id: 7406,
      name: 'Gás (Ultragaz)',
      amt: R(110),
      dueDay: 20,
      icon: '🔥',
      color: '#f97316',
      category: 'Moradia',
      paid: false,
      paidAt: null,
      paidAmount: null,
    },
    {
      id: 7407,
      name: 'Plano de saúde Unimed',
      amt: R(456.8),
      dueDay: 3,
      icon: '🏥',
      color: '#ef4444',
      category: 'Saúde',
      paid: true,
      paidAt: '2026-08-03',
      paidAmount: R(456.8),
    },
    {
      id: 7408,
      name: 'Seguro auto Porto',
      amt: R(289.9),
      dueDay: 25,
      icon: '🚗',
      color: '#64748b',
      category: 'Transporte',
      paid: false,
      paidAt: null,
      paidAmount: null,
    },
  ]

  const subscriptions: Subscription[] = [
    {
      id: 7501,
      name: 'Netflix',
      amt: R(55.9),
      day: 12,
      icon: '🎬',
      color: '#ef4444',
      cardId: MARIANA_DEMO_IDS.cardNubank,
    },
    {
      id: 7502,
      name: 'Spotify',
      amt: R(27.9),
      day: 8,
      icon: '🎵',
      color: '#22c55e',
      cardId: MARIANA_DEMO_IDS.cardNubank,
    },
    {
      id: 7503,
      name: 'Disney+',
      amt: R(46.9),
      day: 15,
      icon: '🏰',
      color: '#3b82f6',
      cardId: MARIANA_DEMO_IDS.cardNubank,
    },
    {
      id: 7504,
      name: 'HBO Max',
      amt: R(34.9),
      day: 20,
      icon: '🎭',
      color: '#8b5cf6',
      cardId: MARIANA_DEMO_IDS.cardItau,
    },
    {
      id: 7505,
      name: 'iCloud+ 200GB',
      amt: R(19.9),
      day: 1,
      icon: '☁️',
      color: '#64748b',
      cardId: MARIANA_DEMO_IDS.cardNubank,
    },
    {
      id: 7506,
      name: 'Smart Fit',
      amt: R(119.9),
      day: 5,
      icon: '💪',
      color: '#eab308',
      cardId: null,
    },
  ]

  const installments: Installment[] = [
    {
      id: 7601,
      name: 'iPhone 15 — Apple Store',
      total: R(6599),
      parcels: 12,
      paid: 4,
      icon: '📱',
      color: '#64748b',
      cardId: MARIANA_DEMO_IDS.cardNubank,
    },
    {
      id: 7602,
      name: 'Geladeira Brastemp',
      total: R(2899),
      parcels: 10,
      paid: 7,
      icon: '🧊',
      color: '#06b6d4',
      cardId: MARIANA_DEMO_IDS.cardItau,
    },
  ]

  const goals: Goal[] = [
    {
      id: 7701,
      name: 'Viagem Disney',
      target: R(35000),
      saved: R(8200),
      icon: '🏰',
      color: '#22c55e',
      deadline: '2027-07-01',
    },
    {
      id: 7702,
      name: 'Reserva de emergência',
      target: R(18000),
      saved: R(11200),
      icon: '🛡️',
      color: '#3b82f6',
      deadline: null,
    },
    {
      id: 7703,
      name: 'Entrada do apê',
      target: R(80000),
      saved: R(24500),
      icon: '🏠',
      color: '#f97316',
      deadline: '2028-12-01',
    },
  ]

  const incomes: Income[] = [
    {
      id: 7901,
      name: 'Salário — Empresa XYZ',
      amt: R(6500),
      freq: 'mensal',
      icon: '💼',
      color: '#22c55e',
      accountId: MARIANA_DEMO_IDS.accountItau,
      days: [5],
      received: ['2026-08-05'],
      auto: true,
    },
    {
      id: 7902,
      name: 'Freelance design',
      amt: R(1800),
      freq: 'mensal',
      icon: '🎨',
      color: '#8b5cf6',
      accountId: MARIANA_DEMO_IDS.accountNubank,
      days: [15],
      received: ['2026-07-15'],
      auto: false,
    },
  ]

  const investments: Investment[] = [
    {
      id: 7801,
      name: 'CDB Sofisa 110% CDI',
      bank: 'Sofisa',
      amount: R(15000),
      date: '2025-11-10',
      type: 'cdb',
      pct: 110,
      spread: 0,
      yield: 0,
      ticker: null,
      accountId: MARIANA_DEMO_IDS.accountPoupanca,
    },
    {
      id: 7802,
      name: 'Tesouro Selic 2029',
      bank: 'Tesouro Direto',
      amount: R(5200),
      date: '2026-01-20',
      type: 'selic',
      pct: 100,
      spread: 0,
      yield: 0,
      ticker: null,
      accountId: null,
    },
    {
      id: 7803,
      name: 'Maxi Renda',
      bank: 'XP',
      amount: R(2400),
      date: '2026-03-05',
      type: 'fii',
      pct: 0,
      spread: 0,
      yield: 8.2,
      ticker: 'MXRF11',
      accountId: null,
    },
  ]

  const transactions: Transaction[] = [
    tx(8001, 'Salário agosto', 'salario', 6500, '2026-08-05', MARIANA_DEMO_IDS.accountItau),
    tx(8002, 'Aluguel pago', 'moradia', -2200, '2026-08-05'),
    tx(8003, 'Condomínio', 'moradia', -680, '2026-08-09'),
    tx(8004, 'Supermercado', 'mercado', -312.45, '2026-08-03'),
    tx(8005, 'Padaria', 'alimentacao', -28.5, '2026-08-04'),
    tx(8006, 'iFood', 'alimentacao', -67.9, '2026-08-05'),
    tx(8007, 'Uber', 'transporte', -24.3, '2026-08-06'),
    tx(8008, 'Posto Ipiranga', 'transporte', -280, '2026-08-01'),
    tx(8009, 'Farmácia', 'saude', -45.6, '2026-08-02'),
    tx(8010, 'Academia (mensalidade)', 'lazer', -119.9, '2026-08-05'),
    tx(8011, 'Freelance — logo cliente A', 'freelance', 900, '2026-07-15'),
    tx(8012, 'Restaurante', 'lazer', -198, '2026-07-30'),
    tx(8013, 'Cinema', 'lazer', -82, '2026-07-26'),
    tx(8014, 'Salário julho', 'salario', 6500, '2026-07-05', MARIANA_DEMO_IDS.accountItau),
    tx(8015, 'Energia julho', 'moradia', -176.2, '2026-07-12'),
    tx(8016, 'Água julho', 'moradia', -88.1, '2026-07-14'),
    tx(8017, 'Internet', 'moradia', -129.99, '2026-07-08'),
    tx(8018, 'Presente aniversário', 'outros', -150, '2026-07-20'),
    tx(8019, 'Pix recebido — freelance', 'freelance', 1800, '2026-06-15'),
    tx(8020, 'Salário junho', 'salario', 6500, '2026-06-05', MARIANA_DEMO_IDS.accountItau),
  ]

  return {
    transactions,
    cards,
    installments,
    subscriptions,
    goals,
    bankAccounts,
    incomes,
    fixedBills,
    investments,
  }
}
