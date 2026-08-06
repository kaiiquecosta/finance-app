/** Status do roadmap da comunidade (colunas do Kanban). */
export type CommunityItemStatus = 'backlog' | 'planned' | 'in_progress' | 'done'

export interface CommunityItem {
  id: number
  authorId: string | null
  title: string
  body: string
  status: CommunityItemStatus
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  authorName?: string | null
}

export interface CommunityComment {
  id: number
  itemId: number
  authorId: string | null
  body: string
  createdAt: string
  authorName?: string | null
}

export const COMMUNITY_COLUMNS: { status: CommunityItemStatus; title: string; hint: string }[] = [
  { status: 'backlog', title: 'Backlog', hint: 'Ideias em consideração — curta as que mais importam.' },
  { status: 'planned', title: 'Faremos', hint: 'Priorizamos pelo interesse da comunidade.' },
  { status: 'in_progress', title: 'Estamos cozinhando', hint: 'Em desenvolvimento agora.' },
  { status: 'done', title: 'Pronto', hint: 'Já disponível no app.' },
]

/** Ordenação dentro da coluna: mais curtidas primeiro, depois mais recentes. */
export function sortCommunityItems(items: CommunityItem[]): CommunityItem[] {
  return [...items].sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
