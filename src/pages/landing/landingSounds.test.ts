import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ensureLandingAudioReady, initLandingAudio, playKeyTap } from './landingSounds'

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

  it('não toca som com prefers-reduced-motion', async () => {
    await expect(ensureLandingAudioReady()).resolves.toBe(false)
    expect(() => playKeyTap()).not.toThrow()
  })

  it('initLandingAudio não lança erro', () => {
    expect(() => initLandingAudio()).not.toThrow()
  })
})
