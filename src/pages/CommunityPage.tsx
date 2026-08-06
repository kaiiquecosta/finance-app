import { useEffect, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useProfile } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { CommunityBoard } from '@/features/community/CommunityBoard'
import { CommunityItemModal, CreateCommunityItemModal } from '@/features/community/CommunityModals'
import { useCommunityBoard, useCommunityMutations } from '@/features/community/useCommunity'
import { isCommunityAdmin } from '@/lib/isCommunityAdmin'
import type { CommunityItem } from '@/domain/community'

export function CommunityPage() {
  const { user } = useAuth()
  const profileQuery = useProfile(user?.id)
  const board = useCommunityBoard(user?.id)
  const mutations = useCommunityMutations(user?.id)

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<CommunityItem | null>(null)

  const isAdmin = isCommunityAdmin(user, profileQuery.data)
  const canEditSelected =
    !!selected && !!user?.id && (selected.authorId === user.id || isAdmin)

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

      <CommunityBoard
        items={items}
        isAdmin={isAdmin}
        onOpenItem={(item) => setSelected(item)}
        onQuickAddBacklog={openCreate}
        onStatusChange={(id, status) => mutations.updateItem.mutate({ id, status })}
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
