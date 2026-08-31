import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
  },
}))

import { Capacitor } from '@capacitor/core'
import { billingChannel, isGooglePlayBilling, isStripeBilling } from './billingPlatform'

describe('billingPlatform', () => {
  it('usa Stripe na web', () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
    expect(billingChannel()).toBe('stripe')
    expect(isStripeBilling()).toBe(true)
    expect(isGooglePlayBilling()).toBe(false)
  })

  it('usa Google Play no Android', () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
    expect(billingChannel()).toBe('google_play')
    expect(isGooglePlayBilling()).toBe(true)
  })
})
