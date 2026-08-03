import { describe, expect, it } from 'vitest'
import { TESTIMONIALS, avatarTone, initials } from './testimonials.data'

describe('depoimentos da landing', () => {
  /**
   * Esta é a guarda que importa. Depoimento sem link de origem é depoimento que
   * ninguém consegue conferir — e é exatamente assim que um texto inventado ou
   * um placeholder de layout chega em produção sem alguém notar. Exigir `source`
   * http(s) faz o CI falhar antes disso acontecer.
   */
  it('todo depoimento tem fonte verificável', () => {
    for (const t of TESTIMONIALS) {
      expect(t.source, `depoimento de "${t.name}" sem fonte`).toMatch(/^https?:\/\/.+/)
    }
  })

  it('todo depoimento tem nome e relato preenchidos', () => {
    for (const t of TESTIMONIALS) {
      expect(t.name.trim().length, 'nome vazio').toBeGreaterThan(0)
      expect(t.quote.trim().length, `relato vazio em "${t.name}"`).toBeGreaterThan(0)
    }
  })

  it('não repete a mesma fonte (evita entrada duplicada)', () => {
    const fontes = TESTIMONIALS.map((t) => t.source)
    expect(new Set(fontes).size).toBe(fontes.length)
  })
})

describe('initials', () => {
  it('usa primeiro e último nome', () => {
    expect(initials('Ana Paula Souza')).toBe('AS')
  })

  it('funciona com um nome só', () => {
    expect(initials('Matheus')).toBe('M')
  })

  it('ignora espaços sobrando', () => {
    expect(initials('  joão   silva  ')).toBe('JS')
  })

  it('não quebra com string vazia', () => {
    expect(initials('   ')).toBe('?')
  })
})

describe('avatarTone', () => {
  it('é determinístico — a mesma pessoa mantém a cor entre sessões', () => {
    expect(avatarTone('Ana Paula Souza')).toBe(avatarTone('Ana Paula Souza'))
  })

  it('fica sempre no intervalo dos tons existentes (0..3)', () => {
    for (const n of ['A', 'Ana', 'Bruno Costa', 'Zoe', 'Maria Eduarda Nogueira', '']) {
      const t = avatarTone(n)
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThanOrEqual(3)
      expect(Number.isInteger(t)).toBe(true)
    }
  })
})
