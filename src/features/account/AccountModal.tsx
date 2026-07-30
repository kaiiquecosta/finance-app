import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData, usePlan, useProfile } from '@/data/hooks'
import { buildExportBundle, downloadJson } from '@/data/export'
import { deleteAccount } from '@/data/account'
import { toISODate } from '@/domain/dates'
import styles from './AccountModal.module.css'

const CONFIRM_WORD = 'EXCLUIR'

interface Props {
  open: boolean
  onClose: () => void
}

export function AccountModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const { data: finance } = useFinanceData(user?.id)
  const { data: profile } = useProfile(user?.id)
  const { data: plan } = usePlan(user?.id)

  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setConfirming(false)
    setConfirmText('')
    setError('')
    onClose()
  }

  const exportData = () => {
    if (!finance || !user?.email) return
    const bundle = buildExportBundle(user.email, profile, plan, finance)
    downloadJson(`finance-dados-${toISODate(new Date())}.json`, bundle)
  }

  const confirmDelete = async () => {
    setError('')
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      return setError(`Digite "${CONFIRM_WORD}" para confirmar.`)
    }
    setDeleting(true)
    try {
      await deleteAccount()
      // A sessão foi encerrada — o App troca para a landing automaticamente.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir a conta.')
      setDeleting(false)
    }
  }

  return (
    <Modal open={open} title="⚙️ Minha conta" onClose={close}>
      <div className={styles.section}>
        <p className={styles.email}>{user?.email}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.h3}>Exportar meus dados</h3>
        <p className={styles.desc}>
          Baixe uma cópia de tudo que você cadastrou (transações, cartões, investimentos, metas…)
          em um arquivo .json.
        </p>
        <Button variant="ghost" onClick={exportData} disabled={!finance}>
          ⬇ Baixar meus dados
        </Button>
      </div>

      <div className={styles.danger}>
        <h3 className={styles.h3Danger}>Zona de risco</h3>
        {!confirming ? (
          <>
            <p className={styles.desc}>
              Excluir sua conta remove permanentemente todos os seus dados e cancela a assinatura,
              se houver. Esta ação não pode ser desfeita.
            </p>
            <Button variant="danger" onClick={() => setConfirming(true)}>
              Excluir minha conta
            </Button>
          </>
        ) : (
          <>
            <p className={styles.desc}>
              Para confirmar, digite <b>{CONFIRM_WORD}</b> abaixo.
            </p>
            <TextField
              name="confirm-delete"
              placeholder={CONFIRM_WORD}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                block
                loading={deleting}
                onClick={() => void confirmDelete()}
              >
                Confirmar exclusão
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
