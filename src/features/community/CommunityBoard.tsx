import { useMemo } from 'react'
import type { CommunityItem, CommunityItemStatus } from '@/domain/community'
import { COMMUNITY_COLUMNS, sortCommunityItems } from '@/domain/community'
import styles from './community.module.css'

interface CommunityBoardProps {
  items: CommunityItem[]
  isAdmin: boolean
  onOpenItem: (item: CommunityItem) => void
  onQuickAddBacklog: () => void
  onStatusChange: (itemId: number, status: CommunityItemStatus) => void
  onToggleLike: (item: CommunityItem) => void
  likePending?: boolean
}

export function CommunityBoard({
  items,
  isAdmin,
  onOpenItem,
  onQuickAddBacklog,
  onStatusChange,
  onToggleLike,
  likePending,
}: CommunityBoardProps) {
  const byStatus = useMemo(() => {
    const map = new Map<CommunityItemStatus, CommunityItem[]>()
    for (const col of COMMUNITY_COLUMNS) map.set(col.status, [])
    for (const item of items) {
      const list = map.get(item.status) ?? []
      list.push(item)
      map.set(item.status, list)
    }
    for (const [status, list] of map) {
      map.set(status, sortCommunityItems(list))
    }
    return map
  }, [items])

  return (
    <div className={styles.communityBoard}>
      {COMMUNITY_COLUMNS.map((col) => {
        const colItems = byStatus.get(col.status) ?? []
        return (
          <section key={col.status} className={styles.column} aria-label={col.title}>
            <div className={styles.columnHead}>
              <h2 className={styles.columnTitle}>{col.title}</h2>
              <p className={styles.columnHint}>{col.hint}</p>
            </div>
            {col.status === 'backlog' && (
              <button type="button" className={styles.addCard} onClick={onQuickAddBacklog}>
                Adicionar sugestão +
              </button>
            )}
            {colItems.length === 0 ? (
              <p className={styles.emptyCol}>Nenhuma ideia aqui ainda.</p>
            ) : (
              colItems.map((item) => (
                <CommunityCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onOpen={() => onOpenItem(item)}
                  onStatusChange={(status) => onStatusChange(item.id, status)}
                  onToggleLike={() => onToggleLike(item)}
                  likePending={likePending}
                />
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}

function CommunityCard({
  item,
  isAdmin,
  onOpen,
  onStatusChange,
  onToggleLike,
  likePending,
}: {
  item: CommunityItem
  isAdmin: boolean
  onOpen: () => void
  onStatusChange: (status: CommunityItemStatus) => void
  onToggleLike: () => void
  likePending?: boolean
}) {
  return (
    <article
      className={styles.itemCard}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <h3 className={styles.itemTitle}>{item.title}</h3>
      {item.body ? <p className={styles.itemBody}>{item.body}</p> : null}
      <div className={styles.itemMeta}>
        <span>{item.authorName ? `por ${item.authorName}` : 'Comunidade'}</span>
        <div className={styles.itemActions}>
          <span className={styles.commentCount} aria-label={`${item.commentCount} comentários`}>
            💬 {item.commentCount}
          </span>
          <button
            type="button"
            className={`${styles.likeBtn} ${item.likedByMe ? styles.likeBtnActive : ''}`}
            disabled={likePending}
            aria-pressed={item.likedByMe}
            aria-label={item.likedByMe ? 'Remover curtida' : 'Curtir'}
            onClick={(e) => {
              e.stopPropagation()
              onToggleLike()
            }}
          >
            {item.likedByMe ? '♥' : '♡'} {item.likeCount}
          </button>
        </div>
      </div>
      {isAdmin && (
        <select
          className={styles.adminSelect}
          value={item.status}
          aria-label="Mover coluna"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as CommunityItemStatus)}
        >
          {COMMUNITY_COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>
              {c.title}
            </option>
          ))}
        </select>
      )}
    </article>
  )
}
