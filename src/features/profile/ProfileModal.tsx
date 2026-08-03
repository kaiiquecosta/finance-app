import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/app/SessionProvider'
import { useProfile } from '@/data/hooks'
import { signOut } from '@/data/auth'
import { formatPhone } from '@/lib/format'
import { useProfileMutations } from './useProfileMutations'
import styles from './ProfileModal.module.css'

const AVATAR_EMOJIS = [
  '😊', '😎', '🦁', '🐯', '🦊', '🐼', '🦋', '⚡',
  '🌟', '🎯', '🚀', '🔥', '💎', '👑', '🎸', '🏆',
  '🌈', '🐉', '🦅', '🎭', '🌺', '🍀', '⚽', '🎮',
]

const DEFAULT_COLOR = '#22c55e'

interface Props {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { saveInfo, savePhoto, saveEmoji } = useProfileMutations(user?.id)
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const displayName =
    profile?.name || (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Você'
  const color = profile?.color || DEFAULT_COLOR
  const photo = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined)
  const emoji = profile?.emoji || '😊'

  useEffect(() => {
    if (!open) return
    setEditing(false)
    setError('')
    setName(profile?.name ?? '')
    setPhone(profile?.phone ?? '')
  }, [open, profile])

  const submitInfo = async () => {
    setError('')
    if (!name.trim()) return setError('Informe seu nome.')
    try {
      await saveInfo.mutateAsync({ name: name.trim(), phone: phone.trim() || null })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      await savePhoto.mutateAsync(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a foto.')
    }
  }

  return (
    <Modal open={open} title="Meu perfil" onClose={onClose}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <button
            type="button"
            className={styles.avatar}
            style={{ borderColor: `${color}80`, background: `${color}1a` }}
            onClick={() => fileRef.current?.click()}
            title="Trocar foto"
            disabled={savePhoto.isPending}
          >
            {photo ? <img src={photo} alt="" className={styles.avatarImg} /> : emoji}
          </button>
          <span className={styles.cameraBadge} style={{ background: color }} aria-hidden>
            📷
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) => void onPickFile(e.target.files?.[0])}
          />
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <TextField
              name="profile-name"
              label="Nome"
              autoFocus
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              name="profile-phone"
              label="Telefone"
              type="tel"
              placeholder="(11) 91234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
            <div className={styles.editActions}>
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saveInfo.isPending}>
                Cancelar
              </Button>
              <Button block loading={saveInfo.isPending} onClick={() => void submitInfo()}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.nameRow}>
              <span className={styles.name}>{displayName}</span>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditing(true)}
                title="Editar nome e telefone"
              >
                ✏️
              </button>
            </div>
            <span className={styles.phone}>{profile?.phone || user?.email}</span>
          </>
        )}
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Escolha seu avatar</span>
        <div className={styles.emojiGrid}>
          {AVATAR_EMOJIS.map((em) => {
            const active = !photo && emoji === em
            return (
              <button
                key={em}
                type="button"
                className={active ? `${styles.emoji} ${styles.emojiActive}` : styles.emoji}
                style={active ? { borderColor: color, background: `${color}22` } : undefined}
                onClick={() => void saveEmoji.mutateAsync(em)}
                disabled={saveEmoji.isPending}
              >
                {em}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" className={styles.logout} onClick={() => void signOut()}>
        <span aria-hidden>🚪</span> Sair da conta
      </button>
    </Modal>
  )
}
