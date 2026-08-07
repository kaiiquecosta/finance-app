import { describe, expect, it } from 'vitest'
import { appendSpeechFragment, lineFromSpeechResults } from './speechTranscript'

describe('appendSpeechFragment', () => {
  it('evita colar palavras', () => {
    expect(appendSpeechFragment('coxinha', 'r$ 10')).toBe('coxinha r$ 10')
  })

  it('não repete trecho já no final', () => {
    expect(appendSpeechFragment('coxinha r$ 10', 'r$ 10')).toBe('coxinha r$ 10')
    expect(appendSpeechFragment("McDonald's", "McDonald's")).toBe("McDonald's")
  })

  it('aceita expansão do mesmo trecho (interim → final)', () => {
    expect(appendSpeechFragment('coxinha', 'coxinha r$ 10')).toBe('coxinha r$ 10')
  })
})

describe('lineFromSpeechResults', () => {
  it('acumula só novos índices finais e mostra interim separado', () => {
    const r1 = lineFromSpeechResults(
      [{ isFinal: false, transcript: 'coxinha' }],
      0,
      '',
    )
    expect(r1.line).toBe('coxinha')
    expect(r1.sessionFinal).toBe('')

    const r2 = lineFromSpeechResults(
      [
        { isFinal: true, transcript: 'coxinha' },
        { isFinal: false, transcript: ' r$ 10' },
      ],
      0,
      '',
    )
    expect(r2.sessionFinal).toBe('coxinha')
    expect(r2.line).toBe('coxinha r$ 10')
  })

  it('não duplica ao processar só resultIndex novo', () => {
    let session = ''
    const e1 = lineFromSpeechResults(
      [{ isFinal: true, transcript: 'coxinha' }],
      0,
      session,
    )
    session = e1.sessionFinal
    const e2 = lineFromSpeechResults(
      [
        { isFinal: true, transcript: 'coxinha' },
        { isFinal: true, transcript: 'r$ 10' },
      ],
      1,
      session,
    )
    expect(e2.line).toBe('coxinha r$ 10')
  })
})
