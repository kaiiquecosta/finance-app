import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { CommunityItem } from '@/domain/community'
import { useCommunityComments } from '@/features/community/useCommunity'
import styles from './community.module.css'

interface CommunityItemModalProps {
  open: boolean
  item: CommunityItem | null
  isAdmin: boolean
  canEdit: boolean
  onClose: () => void
  onSave: (patch: { title: string; body: string }) => void
  onDelete: () => void
  onPostComment: (body: string) => void
  onToggleLike: () => void
  saving?: boolean
  commenting?: boolean
}

export function CommunityItemModal({
  open,
  item,
  isAdmin,
  canEdit,
  onClose,
  onSave,
  onDelete,
  onPostComment,
  onToggleLike,
  saving,
  commenting,
}: CommunityItemModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [comment, setComment] = useState('')
  const commentsQuery = useCommunityComments(item?.id ?? null, open)

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setBody(item.body)
    setComment('')
  }, [item, open])

  if (!item) return null

  const editing = canEdit || isAdmin

  return (
    <Modal
      open={open}
      title={editing ? 'Editar sugestão' : item.title}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {(canEdit || isAdmin) && (
            <Button variant="danger" type="button" onClick={onDelete}>
              Excluir
            </Button>
          )}
          {editing && (
            <Button
              type="button"
              loading={saving}
              onClick={() => onSave({ title, body })}
              disabled={!title.trim()}
            >
              Salvar
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      {editing ? (
        <>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
            Título
          </label>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          <label
            style={{ display: 'block', fontSize: 12, margin: '12px 0 6px', color: 'var(--muted)' }}
          >
            Descrição
          </label>
          <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
            {item.body || 'Sem descrição.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              className={`${styles.likeBtn} ${item.likedByMe ? styles.likeBtnActive : ''}`}
              onClick={onToggleLike}
            >
              {item.likedByMe ? '♥' : '♡'} {item.likeCount} curtidas
            </button>
            <span className={styles.commentCount}>💬 {item.commentCount}</span>
          </div>
        </>
      )}

      <h3 style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 10px' }}>Comentários</h3>
      <div className={styles.commentList}>
        {commentsQuery.isLoading ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p>
        ) : commentsQuery.data?.length ? (
          commentsQuery.data.map((c) => (
            <div key={c.id} className={styles.commentBubble}>
              <p className={styles.commentBody}>{c.body}</p>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Seja o primeiro a comentar.</p>
        )}
      </div>
      <div className={styles.commentForm}>
        <textarea
          className={styles.textarea}
          placeholder="Conte por que isso é importante para você…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <Button
          type="button"
          loading={commenting}
          disabled={!comment.trim()}
          onClick={() => {
            onPostComment(comment.trim())
            setComment('')
          }}
        >
          Comentar
        </Button>
      </div>
    </Modal>
  )
}

interface CreateCommunityItemModalProps {
  open: boolean
  onClose: () => void
  onCreate: (title: string, body: string) => void
  loading?: boolean
}

export function CreateCommunityItemModal({ open, onClose, onCreate, loading }: CreateCommunityItemModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (open) {
      setTitle('')
      setBody('')
    }
  }, [open])

  return (
    <Modal
      open={open}
      title="Nova sugestão"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            loading={loading}
            disabled={!title.trim()}
            onClick={() => onCreate(title.trim(), body.trim())}
          >
            Publicar no backlog
          </Button>
        </div>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Descreva a melhoria que você quer ver no Flux. A comunidade curte e comenta — priorizamos o que
        tiver mais interesse.
      </p>
      <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>Título</label>
      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex.: Modo escuro automático"
      />
      <label style={{ display: 'block', fontSize: 12, margin: '12px 0 6px', color: 'var(--muted)' }}>
        Detalhes (opcional)
      </label>
      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Como isso te ajudaria no dia a dia?"
      />
    </Modal>
  )
}
