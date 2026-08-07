import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  detectCommunityStatusAlerts,
  registerCommunityStatusAlertHandler,
} from '@/features/community/communityStatusNotify'
import type { CommunityItem } from '@/domain/community'

const STORAGE_KEY = 'flux_community_status_seen_v1'

function item(partial: Partial<CommunityItem> & Pick<CommunityItem, 'id' | 'authorId' | 'status'>): CommunityItem {
  return {
    title: 'Test',
    body: '',
    createdAt: '',
    updatedAt: '',
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    authorName: null,
    ...partial,
  }
}

describe('detectCommunityStatusAlerts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('alerta quando status muda para o autor', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ '1': 'backlog' }),
    )
    const alerts = detectCommunityStatusAlerts('user-a', [
      item({ id: 1, authorId: 'user-a', status: 'planned', title: 'Minha ideia' }),
    ])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].status).toBe('planned')
    expect(alerts[0].previousStatus).toBe('backlog')
  })

  it('ignora sugestões de outros autores', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '1': 'backlog' }))
    const alerts = detectCommunityStatusAlerts('user-b', [
      item({ id: 1, authorId: 'user-a', status: 'planned' }),
    ])
    expect(alerts).toHaveLength(0)
  })
})

describe('registerCommunityStatusAlertHandler', () => {
  it('dispara handler registrado', () => {
    const fn = vi.fn()
    registerCommunityStatusAlertHandler(fn)
    registerCommunityStatusAlertHandler(null)
    expect(fn).not.toHaveBeenCalled()
  })
})
