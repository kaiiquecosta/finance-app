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

export const COMMUNITY_COLUMNS: {
  status: CommunityItemStatus
  title: string
  shortTitle: string
  hint: string
}[] = [
  {
    status: 'backlog',
    title: 'Sugestões',
    shortTitle: 'Sugestões',
    hint: 'Ideias em consideração — curta as que mais importam.',
  },
  {
    status: 'planned',
    title: 'Planejado',
    shortTitle: 'Planejado',
    hint: 'Priorizamos pelo interesse da comunidade.',
  },
  {
    status: 'in_progress',
    title: 'Em desenvolvimento',
    shortTitle: 'Desenvolv.',
    hint: 'Estamos trabalhando nisso agora.',
  },
  { status: 'done', title: 'Pronto', shortTitle: 'Pronto', hint: 'Já disponível no app.' },
]

export function communityColumnTitle(status: CommunityItemStatus, short = false): string {
  const col = COMMUNITY_COLUMNS.find((c) => c.status === status)
  if (!col) return status
  return short ? col.shortTitle : col.title
}

/** Ordenação dentro da coluna: mais curtidas primeiro, depois mais recentes. */
export function sortCommunityItems(items: CommunityItem[]): CommunityItem[] {
  return [...items].sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
