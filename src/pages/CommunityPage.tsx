import { useEffect, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useProfile } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { CommunityBoard } from '@/features/community/CommunityBoard'
import { CommunityItemModal, CreateCommunityItemModal } from '@/features/community/CommunityModals'
import { useCommunityBoard, useCommunityMutations } from '@/features/community/useCommunity'
import { isCommunityAdmin } from '@/lib/isCommunityAdmin'
import { showSaveToast } from '@/lib/toast'
import {
  communityStatusAdminToast,
  pushCommunityStatusAlert,
} from '@/features/community/communityStatusNotify'
import {
  ensureNotificationPermission,
  markCommunityNotifPromptAnswered,
  shouldShowCommunityNotifBanner,
} from '@/features/community/communityBrowserNotify'
import styles from '@/features/community/community.module.css'
import type { CommunityItem, CommunityItemStatus } from '@/domain/community'

export function CommunityPage() {
  const { user } = useAuth()
  const profileQuery = useProfile(user?.id)
  const board = useCommunityBoard(user?.id)
  const mutations = useCommunityMutations(user?.id)

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<CommunityItem | null>(null)
  const [notifBanner, setNotifBanner] = useState(false)

  useEffect(() => {
    setNotifBanner(shouldShowCommunityNotifBanner())
  }, [])

  const dismissNotifBanner = () => {
    markCommunityNotifPromptAnswered()
    setNotifBanner(false)
  }

  const isAdmin = isCommunityAdmin(user, profileQuery.data)
  const canEditSelected =
    !!selected && !!user?.id && (selected.authorId === user.id || isAdmin)

  const handleStatusChange = (id: number, status: CommunityItemStatus) => {
    const item = board.data?.find((i) => i.id === id)
    const prev = item?.status
    if (!item || prev === status) return
    mutations.updateItem.mutate(
      { id, status },
      {
        onSuccess: () => {
          if (isAdmin) {
            showSaveToast(
              communityStatusAdminToast(status),
              'var(--primary)',
              'Comunidade',
              '📣',
            )
          }
          if (item.authorId === user?.id && prev != null) {
            pushCommunityStatusAlert({
              itemId: id,
              title: item.title,
              status,
              previousStatus: prev,
            })
          }
        },
      },
    )
  }

  useEffect(() => {
    setSelected((cur) => {
      if (!cur || !board.data) return cur
      return board.data.find((i) => i.id === cur.id) ?? cur
    })
  }, [board.data])

  const openCreate = () => setCreateOpen(true)

  if (board.isLoading) {
    return <PageHeader title="Comunidade" subtitle="Carregando roadmap…" />
  }

  if (board.isError) {
    const msg = (board.error as Error)?.message ?? ''
    const missingTables = msg.includes('community_items') || msg.includes('does not exist')
    return (
      <>
        <PageHeader title="Comunidade" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            {missingTables
              ? 'A Comunidade ainda não está ativa neste projeto Supabase. Aplique a migration supabase/migrations/0004_community.sql no SQL Editor e recarregue.'
              : 'Não foi possível carregar a comunidade. Tente de novo em instantes.'}
          </p>
        </div>
      </>
    )
  }

  const items = board.data ?? []

  return (
    <>
      <PageHeader
        title="Comunidade"
        subtitle="Sugira melhorias, comente e curta — priorizamos pelo interesse de todos."
        action={
          <Button type="button" onClick={openCreate}>
            ＋ Nova sugestão
          </Button>
        }
      />

      {notifBanner && (
        <div className={styles.notifHint} role="status">
          <p className={styles.notifHintText}>
            Ative as notificações para saber quando sua sugestão mudar de coluna (Sugestões → Planejado,
            etc.), mesmo fora desta página.
          </p>
          <div className={styles.notifActions}>
            <button
              type="button"
              className={styles.notifBtnPrimary}
              onClick={() => {
                void ensureNotificationPermission().finally(dismissNotifBanner)
              }}
            >
              Sim, ativar
            </button>
            <button type="button" className={styles.notifBtnGhost} onClick={dismissNotifBanner}>
              Agora não
            </button>
          </div>
        </div>
      )}

      <CommunityBoard
        items={items}
        isAdmin={isAdmin}
        onOpenItem={(item) => setSelected(item)}
        onQuickAddBacklog={openCreate}
        onStatusChange={handleStatusChange}
        onToggleLike={(item) => mutations.toggleLike.mutate({ itemId: item.id, liked: item.likedByMe })}
        likePending={mutations.toggleLike.isPending}
      />

      <CreateCommunityItemModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={mutations.createItem.isPending}
        onCreate={(title, body) => {
          mutations.createItem.mutate(
            { title, body },
            {
              onSuccess: () => setCreateOpen(false),
            },
          )
        }}
      />

      <CommunityItemModal
        open={!!selected}
        item={selected}
        isAdmin={isAdmin}
        canEdit={canEditSelected}
        onClose={() => setSelected(null)}
        saving={mutations.updateItem.isPending}
        commenting={mutations.postComment.isPending}
        onSave={(patch) => {
          if (!selected) return
          mutations.updateItem.mutate({ id: selected.id, ...patch })
        }}
        onDelete={() => {
          if (!selected) return
          mutations.removeItem.mutate(selected.id, { onSuccess: () => setSelected(null) })
        }}
        onPostComment={(body) => {
          if (!selected) return
          mutations.postComment.mutate({ itemId: selected.id, body })
        }}
        onToggleLike={() => {
          if (!selected) return
          mutations.toggleLike.mutate({ itemId: selected.id, liked: selected.likedByMe })
        }}
      />
    </>
  )
}
