import { describe, expect, it } from 'vitest'
import type { Plan } from './entities'
import { isPro, planLabel, trialDaysLeft } from './plan'

const now = new Date(2026, 2, 15)
function plan(p: Partial<Plan>): Plan {
  return {
    userId: 'u1',
    plan: 'free',
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeSubId: null,
    ...p,
  }
}

describe('isPro', () => {
  it('pro ativo → true', () => {
    expect(isPro(plan({ plan: 'pro', status: 'active' }), now)).toBe(true)
  })
  it('trial vigente → true', () => {
    expect(isPro(plan({ status: 'trialing', trialEndsAt: '2026-04-01' }), now)).toBe(true)
  })
  it('trial expirado → false', () => {
    expect(isPro(plan({ status: 'trialing', trialEndsAt: '2026-01-01' }), now)).toBe(false)
  })
  it('free/cancelado/nulo → false', () => {
    expect(isPro(plan({ plan: 'free', status: 'active' }), now)).toBe(false)
    expect(isPro(plan({ status: 'canceled' }), now)).toBe(false)
    expect(isPro(null, now)).toBe(false)
  })
})

describe('trialDaysLeft', () => {
  it('conta os dias restantes do trial', () => {
    expect(trialDaysLeft(plan({ status: 'trialing', trialEndsAt: '2026-03-25' }), now)).toBe(10)
  })
  it('0 fora de trial', () => {
    expect(trialDaysLeft(plan({ plan: 'pro', status: 'active' }), now)).toBe(0)
  })
})

describe('planLabel', () => {
  it('PRO / TRIAL / FREE', () => {
    expect(planLabel(plan({ plan: 'pro', status: 'active' }), now)).toBe('PRO')
    expect(planLabel(plan({ status: 'trialing', trialEndsAt: '2026-04-01' }), now)).toBe('TRIAL')
    expect(planLabel(plan({ status: 'canceled' }), now)).toBe('FREE')
  })
})
