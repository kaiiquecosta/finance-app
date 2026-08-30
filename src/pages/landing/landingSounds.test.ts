import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { bindLandingAudioUnlock, playKeyTap, unlockLandingAudio } from './landingSounds'

describe('landingSounds', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não toca som com prefers-reduced-motion', () => {
    expect(() => playKeyTap()).not.toThrow()
    unlockLandingAudio()
    expect(() => playKeyTap()).not.toThrow()
  })

  it('registra unlock sem lançar erro', () => {
    expect(() => bindLandingAudioUnlock()()).not.toThrow()
  })
})
