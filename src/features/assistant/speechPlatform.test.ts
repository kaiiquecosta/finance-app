import { describe, expect, it, vi } from 'vitest'
import { pickRecognitionTranscript, useSingleUtteranceDictation } from './speechPlatform'

describe('speechPlatform', () => {
  it('Android usa frase única', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    })
    expect(useSingleUtteranceDictation()).toBe(true)
    vi.unstubAllGlobals()
  })

  it('prefere alternativa com número no Android', () => {
    const t = pickRecognitionTranscript(
      [{ transcript: 'reais coxinha' }, { transcript: '10 reais coxinha' }],
      true,
    )
    expect(t).toBe('10 reais coxinha')
  })
})
