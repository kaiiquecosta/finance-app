import styles from './UserBadge.module.css'

interface Props {
  name: string
  emoji: string
  photoUrl?: string | null
  accent?: string
  onClick: () => void
}

export function UserBadge({ name, emoji, photoUrl, accent = '#22c55e', onClick }: Props) {
  const short = name.trim().split(/\s+/)[0] || name
  return (
    <button type="button" className={styles.badge} onClick={onClick} title="Meu perfil">
      <span
        className={styles.avatar}
        style={{
          borderColor: `${accent}55`,
          background: `${accent}22`,
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className={styles.photo} />
        ) : (
          <span aria-hidden>{emoji}</span>
        )}
      </span>
      <span className={styles.name}>{short}</span>
    </button>
  )
}
