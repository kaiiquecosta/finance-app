import { supabase } from './supabase'
import type { CommunityComment, CommunityItem, CommunityItemStatus } from '@/domain/community'

interface CommunityItemRow {
  id: number
  author_id: string | null
  title: string
  body: string
  status: CommunityItemStatus
  created_at: string
  updated_at: string
}

interface CommunityCommentRow {
  id: number
  item_id: number
  author_id: string | null
  body: string
  created_at: string
}

interface LikeRow {
  item_id: number
  user_id: string
}

interface ProfileNameRow {
  id: string
  name: string
}

function rowToItem(
  r: CommunityItemRow,
  likeCount: number,
  commentCount: number,
  likedByMe: boolean,
  authorName?: string | null,
): CommunityItem {
  return {
    id: r.id,
    authorId: r.author_id,
    title: r.title,
    body: r.body,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    likeCount,
    commentCount,
    likedByMe,
    authorName,
  }
}

async function fetchAuthorNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return new Map()
  const { data, error } = await supabase.from('profiles').select('id, name').in('id', unique)
  if (error) throw error
  const map = new Map<string, string>()
  for (const p of (data ?? []) as ProfileNameRow[]) map.set(p.id, p.name)
  return map
}

export async function fetchCommunityBoard(userId: string | undefined): Promise<CommunityItem[]> {
  const [itemsRes, likesRes, commentsRes] = await Promise.all([
    supabase.from('community_items').select('*'),
    supabase.from('community_likes').select('item_id, user_id'),
    supabase.from('community_comments').select('item_id'),
  ])
  if (itemsRes.error) throw itemsRes.error
  if (likesRes.error) throw likesRes.error
  if (commentsRes.error) throw commentsRes.error

  const items = (itemsRes.data ?? []) as CommunityItemRow[]
  const likes = (likesRes.data ?? []) as LikeRow[]
  const commentRows = commentsRes.data ?? []

  const likeCountByItem = new Map<number, number>()
  const likedByMe = new Set<number>()
  for (const l of likes) {
    likeCountByItem.set(l.item_id, (likeCountByItem.get(l.item_id) ?? 0) + 1)
    if (userId && l.user_id === userId) likedByMe.add(l.item_id)
  }

  const commentCountByItem = new Map<number, number>()
  for (const c of commentRows as { item_id: number }[]) {
    commentCountByItem.set(c.item_id, (commentCountByItem.get(c.item_id) ?? 0) + 1)
  }

  const authorIds = items.map((i) => i.author_id).filter((id): id is string => !!id)
  const names = await fetchAuthorNames(authorIds)

  return items.map((r) =>
    rowToItem(
      r,
      likeCountByItem.get(r.id) ?? 0,
      commentCountByItem.get(r.id) ?? 0,
      likedByMe.has(r.id),
      r.author_id ? names.get(r.author_id) ?? null : null,
    ),
  )
}

export async function fetchCommunityComments(itemId: number): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as CommunityCommentRow[]
  const names = await fetchAuthorNames(rows.map((r) => r.author_id).filter((id): id is string => !!id))
  return rows.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    authorId: r.author_id,
    body: r.body,
    createdAt: r.created_at,
    authorName: r.author_id ? names.get(r.author_id) ?? null : null,
  }))
}

export async function createCommunityItem(
  userId: string,
  id: number,
  title: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('community_items').insert({
    id,
    author_id: userId,
    title: title.trim(),
    body: body.trim(),
    status: 'backlog',
  })
  if (error) throw error
}

export async function updateCommunityItem(
  id: number,
  patch: { title?: string; body?: string; status?: CommunityItemStatus },
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title.trim()
  if (patch.body !== undefined) row.body = patch.body.trim()
  if (patch.status !== undefined) row.status = patch.status
  if (!Object.keys(row).length) return
  const { error } = await supabase.from('community_items').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteCommunityItem(id: number): Promise<void> {
  const { error } = await supabase.from('community_items').delete().eq('id', id)
  if (error) throw error
}

export async function toggleCommunityLike(itemId: number, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from('community_likes').delete().eq('item_id', itemId).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('community_likes').insert({ item_id: itemId, user_id: userId })
    if (error) throw error
  }
}

export async function addCommunityComment(
  itemId: number,
  userId: string,
  id: number,
  body: string,
): Promise<void> {
  const { error } = await supabase.from('community_comments').insert({
    id,
    item_id: itemId,
    author_id: userId,
    body: body.trim(),
  })
  if (error) throw error
}
