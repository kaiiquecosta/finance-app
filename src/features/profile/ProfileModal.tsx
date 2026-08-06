import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { signOut } from '@/data/auth'
import type { Profile } from '@/domain/entities'
import { useProfileMutations } from './useProfileMutations'
import styles from './ProfileModal.module.css'

const EMOJIS = [
  '😊', '😎', '🦁', '🐯', '🦊', '🐼', '🦋', '⚡', '🌟', '🎯', '🚀', '🔥',
  '💎', '👑', '🎸', '🏆', '🌈', '🐉', '🦅', '🎭', '🌺', '🍀', '⚽', '🎮',
]

const MAX_AVATAR_BYTES = 400_000

interface Props {
  open: boolean
  onClose: () => void
  user: User | null
  profile: Profile | null | undefined
  onOpenAccount: () => void
}

export function ProfileModal({ open, onClose, user, profile, onOpenAccount }: Props) {
  const { save } = useProfileMutations(user?.id)
  const fileRef = useRef<HTMLInputElement>(null)

  const metaName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const defaultName = profile?.name || metaName || user?.email?.split('@')[0] || 'Você'
  const photo =
    profile?.avatarUrl ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null
  const emoji = profile?.emoji || '😊'
  const accent = profile?.color || '#22c55e'

  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [localPhoto, setLocalPhoto] = useState<string | null>(photo)
  const [localEmoji, setLocalEmoji] = useState(emoji)

  useEffect(() => {
    if (!open) return
    setName(profile?.name || metaName || user?.email?.split('@')[0] || 'Você')
    setPhone(profile?.phone ?? '')
    setLocalPhoto(photo)
    setLocalEmoji(profile?.emoji || '😊')
  }, [open, profile, user, metaName, photo])

  const pickEmoji = (em: string) => {
    setLocalEmoji(em)
    setLocalPhoto(null)
    void save.mutateAsync({ emoji: em, avatarUrl: null })
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      alert('Imagem muito grande. Use até ~400 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setLocalPhoto(base64)
      setLocalEmoji('😊')
      void save.mutateAsync({ avatarUrl: base64, emoji: null })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onSaveInfo = () => {
    void save.mutateAsync({ name: name.trim(), phone: phone.trim() || null })
  }

  return (
    <Modal open={open} title="Meu perfil" onClose={onClose}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <button
            type="button"
            className={styles.avatarBig}
            style={{ borderColor: `${accent}55`, background: `${accent}18` }}
            onClick={() => fileRef.current?.click()}
          >
            {localPhoto ? (
              <img src={localPhoto} alt="" />
            ) : (
              localEmoji
            )}
          </button>
          <button
            type="button"
            className={styles.camera}
            onClick={() => fileRef.current?.click()}
            aria-label="Enviar foto"
          >
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>
        <div className={styles.displayName}>{name}</div>
        {phone && <div className={styles.phone}>{phone}</div>}
      </div>

      <div className={styles.sectionLabel}>Escolha seu avatar</div>
      <div className={styles.emojiScroll}>
        <div className={styles.emojiGrid}>
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className={`${styles.emojiBtn} ${!localPhoto && localEmoji === em ? styles.emojiBtnActive : ''}`}
              onClick={() => pickEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sectionLabel}>Seus dados</div>
      <div className={styles.editBlock}>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Telefone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
        />
        <Button block loading={save.isPending} onClick={onSaveInfo}>
          Salvar nome e telefone
        </Button>
      </div>

      <div className={styles.linkRow}>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            onClose()
            onOpenAccount()
          }}
        >
          ⚙️ Exportar dados e excluir conta →
        </button>
        <button type="button" className={styles.linkBtn} onClick={() => void signOut()}>
          Sair da conta
        </button>
      </div>
    </Modal>
  )
}
