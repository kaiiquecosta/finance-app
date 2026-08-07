import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { CATEGORY_ICONS, formatCategoryLabel } from '@/domain/categories'
import { parseFinanceMessage } from '@/domain/parseFinanceMessage'
import { formatBRL, neg } from '@/domain/money'
import {
  newId,
  useTransactionMutations,
} from '@/features/transactions/useTransactionMutations'
import styles from './FinanceAssistant.module.css'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const ACCOUNT_KEY = 'flux_assistant_account_id'

export function FinanceAssistant() {
  const { user } = useAuth()
  const finance = useFinanceData(user?.id)
  const { save } = useTransactionMutations(user?.id)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Oi! Digite um gasto ou receita em uma frase. Ex.: 10 reais coxinha · gastei 45 uber · recebi 500 salário',
    },
  ])
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const pickAccountId = useCallback((): number | null => {
    const accounts = finance.data?.bankAccounts ?? []
    if (!accounts.length) return null
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY)
      if (raw) {
        const id = Number(raw)
        if (accounts.some((a) => a.id === id)) return id
      }
    } catch {
      /* ignore */
    }
    return accounts[0]?.id ?? null
  }, [finance.data?.bankAccounts])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }])
    setSending(true)

    const parsed = parseFinanceMessage(text)
    if (!parsed.ok) {
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: 'assistant', text: parsed.error },
      ])
      setSending(false)
      return
    }

    const accountId = pickAccountId()
    if (accountId == null) {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: 'Cadastre uma conta bancária primeiro (Visão geral ou Transações → Conta).',
        },
      ])
      setSending(false)
      return
    }

    const { kind, name, amount, cat, date } = parsed.data
    const amt = kind === 'expense' ? neg(amount) : amount

    try {
      await save.mutateAsync({
        id: newId(),
        name,
        cat,
        amt,
        date,
        accountId,
        billId: null,
        investmentId: null,
        incomeKey: null,
      })
      try {
        localStorage.setItem(ACCOUNT_KEY, String(accountId))
      } catch {
        /* ignore */
      }
      const icon = CATEGORY_ICONS[cat] ?? (kind === 'income' ? '💰' : '💳')
      const label = kind === 'income' ? 'Receita' : formatCategoryLabel(cat, [])
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `${icon} Registrado: ${name} · ${formatBRL(amount)} · ${label}`,
        },
      ])
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.',
        },
      ])
    }
    setSending(false)
  }

  if (!user) return null

  return (
    <>
      <button
        type="button"
        className={open ? `${styles.fab} ${styles.fabOpen}` : styles.fab}
        aria-expanded={open}
        aria-label={open ? 'Fechar assistente' : 'Assistente de gastos'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Assistente Flux">
          <header className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Assistente</div>
              <div className={styles.panelSub}>Gastos e receitas em linguagem natural</div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fechar">
              ✕
            </button>
          </header>

          <div className={styles.messages} ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? `${styles.bubble} ${styles.bubbleUser}` : `${styles.bubble} ${styles.bubbleBot}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Ex.: 10 reais coxinha"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              autoComplete="off"
            />
            <button type="submit" className={styles.sendBtn} disabled={sending || !input.trim()}>
              {sending ? '…' : '↑'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
