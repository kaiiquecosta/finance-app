import { describe, expect, it, vi } from 'vitest'
import { pickRecognitionTranscript, speechRecognitionMaxAlternatives, useSingleUtteranceDictation } from './speechPlatform'

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

  it('prefere alternativa com número', () => {
    const t = pickRecognitionTranscript([
      { transcript: 'reais coxinha' },
      { transcript: '10 reais coxinha' },
    ])
    expect(t).toBe('10 reais coxinha')
  })

  it('Safari usa uma hipótese no ditado', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    })
    expect(speechRecognitionMaxAlternatives()).toBe(1)
    vi.unstubAllGlobals()
  })
})
