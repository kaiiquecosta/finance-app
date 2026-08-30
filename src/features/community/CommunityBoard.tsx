import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CommunityItem, CommunityItemStatus } from '@/domain/community'
import { COMMUNITY_COLUMNS, sortCommunityItems } from '@/domain/community'
import { useMatchMedia } from '@/lib/useMatchMedia'
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

const COLUMN_SHORT: Record<CommunityItemStatus, string> = Object.fromEntries(
  COMMUNITY_COLUMNS.map((col) => [col.status, col.shortTitle]),
) as Record<CommunityItemStatus, string>

export function CommunityBoard({
  items,
  isAdmin,
  onOpenItem,
  onQuickAddBacklog,
  onStatusChange,
  onToggleLike,
  likePending,
}: CommunityBoardProps) {
  const isMobile = useMatchMedia('(max-width: 639px)')
  const [activeStatus, setActiveStatus] = useState<CommunityItemStatus>('backlog')
  const scrollerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<Partial<Record<CommunityItemStatus, HTMLElement | null>>>({})

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

  const scrollToColumn = useCallback((status: CommunityItemStatus, behavior: ScrollBehavior = 'smooth') => {
    setActiveStatus(status)
    const el = columnRefs.current[status]
    el?.scrollIntoView({ behavior, inline: 'start', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const root = scrollerRef.current
    if (!root) return

    const onScroll = () => {
      const left = root.scrollLeft
      const width = root.clientWidth || 1
      const index = Math.round(left / width)
      const col = COMMUNITY_COLUMNS[index]?.status
      if (col) setActiveStatus(col)
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [isMobile])

  return (
    <div className={isMobile ? styles.boardMobile : styles.boardDesktop}>
      {isMobile && (
        <div className={styles.columnTabs} role="tablist" aria-label="Colunas do roadmap">
          {COMMUNITY_COLUMNS.map((col) => {
            const count = byStatus.get(col.status)?.length ?? 0
            const selected = activeStatus === col.status
            return (
              <button
                key={col.status}
                type="button"
                role="tab"
                aria-selected={selected}
                className={[styles.columnTab, selected ? styles.columnTabActive : ''].filter(Boolean).join(' ')}
                onClick={() => scrollToColumn(col.status)}
              >
                <span className={styles.columnTabLabel}>{COLUMN_SHORT[col.status]}</span>
                <span className={styles.columnTabCount}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div
        ref={scrollerRef}
        className={isMobile ? styles.mobileColumnScroller : styles.communityBoard}
      >
        {COMMUNITY_COLUMNS.map((col) => {
          const colItems = byStatus.get(col.status) ?? []
          return (
            <section
              key={col.status}
              ref={(node) => {
                columnRefs.current[col.status] = node
              }}
              className={isMobile ? styles.mobileColumnPane : styles.column}
              aria-label={col.title}
              id={isMobile ? `community-col-${col.status}` : undefined}
            >
              {!isMobile && (
                <div className={styles.columnHead}>
                  <h2 className={styles.columnTitle}>{col.title}</h2>
                  <p className={styles.columnHint}>{col.hint}</p>
                </div>
              )}
              {isMobile && (
                <div className={styles.mobilePaneHead}>
                  <h2 className={styles.columnTitle}>{col.title}</h2>
                  <p className={styles.columnHint}>{col.hint}</p>
                </div>
              )}
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
