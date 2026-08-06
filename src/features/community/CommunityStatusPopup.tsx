import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { CommunityStatusAlert } from '@/features/community/communityStatusNotify'
import { communityStatusPopupCopy } from '@/features/community/communityStatusNotify'
import styles from './CommunityStatusPopup.module.css'

interface Props {
  queue: CommunityStatusAlert[]
  onDismiss: () => void
}

/** Popup para o autor quando o status da sugestão muda no roadmap. */
export function CommunityStatusPopup({ queue, onDismiss }: Props) {
  const current = queue[0] ?? null
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(queue.length > 0)
  }, [queue.length, current?.itemId, current?.status])

  if (!current) return null

  const copy = communityStatusPopupCopy(current.status, current.title)

  const close = () => {
    setOpen(false)
    onDismiss()
  }

  return (
    <Modal
      open={open}
      title={`${copy.icon} ${copy.heading}`}
      onClose={close}
      footer={
        <Button block type="button" onClick={close}>
          Entendi
        </Button>
      }
    >
      <p className={styles.body}>{renderBody(copy.body)}</p>
    </Modal>
  )
}

/** Destaque leve em trechos **assim**. */
function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i}>{part.slice(2, -2)}</strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}
