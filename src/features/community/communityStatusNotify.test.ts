import { describe, expect, it } from 'vitest'
import { communityStatusPopupCopy } from '@/features/community/communityStatusNotify'

describe('communityStatusPopupCopy', () => {
  it('mensagem para em desenvolvimento', () => {
    const c = communityStatusPopupCopy('in_progress', 'Excluir lançamento')
    expect(c.heading).toMatch(/cozinhando/i)
    expect(c.body).toContain('Excluir lançamento')
  })

  it('mensagem para faremos', () => {
    const c = communityStatusPopupCopy('planned', 'Minha ideia')
    expect(c.heading).toMatch(/desenvolver/i)
  })
})
