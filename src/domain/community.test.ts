import { describe, expect, it } from 'vitest'
import { sortCommunityItems, type CommunityItem } from '@/domain/community'

function item(partial: Partial<CommunityItem> & Pick<CommunityItem, 'id' | 'title'>): CommunityItem {
  return {
    authorId: null,
    body: '',
    status: 'backlog',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    ...partial,
  }
}

describe('sortCommunityItems', () => {
  it('ordena por curtidas desc e depois por data', () => {
    const sorted = sortCommunityItems([
      item({ id: 1, title: 'a', likeCount: 2, createdAt: '2026-01-03T00:00:00Z' }),
      item({ id: 2, title: 'b', likeCount: 5, createdAt: '2026-01-01T00:00:00Z' }),
      item({ id: 3, title: 'c', likeCount: 5, createdAt: '2026-01-05T00:00:00Z' }),
    ])
    expect(sorted.map((i) => i.id)).toEqual([3, 2, 1])
  })
})
