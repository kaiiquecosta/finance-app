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
import { useAssistantSpeech } from './useAssistantSpeech'
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
      text: 'Oi! Digite ou fale em PT/EN. Ex.: 10 reais coxinha · I spent R$10 on coxinha · I earned 500',
    },
  ])
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const dictationBaseRef = useRef('')

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

  const submitMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || sendingRef.current) return
      setInput('')
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }])
      sendingRef.current = true
      setSending(true)

      const parsed = parseFinanceMessage(text)
      if (!parsed.ok) {
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: 'assistant', text: parsed.error },
        ])
        sendingRef.current = false
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
        sendingRef.current = false
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
      sendingRef.current = false
      setSending(false)
    },
    [pickAccountId, save],
  )

  const mergeDictation = useCallback((spoken: string) => {
    const base = dictationBaseRef.current
    const merged = [base, spoken].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    setInput(merged)
  }, [])

  const speech = useAssistantSpeech({
    onTranscript: mergeDictation,
  })

  const onMicClick = () => {
    if (speech.listening) {
      speech.stop()
      return
    }
    dictationBaseRef.current = input.trim()
    void speech.start()
  }

  useEffect(() => {
    if (!open) speech.stop()
  }, [open, speech.stop])

  useEffect(() => {
    if (!speech.error) return
    const msg = speech.error
    setMessages((m) => [...m, { id: `a-speech-${Date.now()}`, role: 'assistant', text: msg }])
    speech.clearError()
  }, [speech.error, speech.clearError])

  const send = () => {
    speech.stop()
    void submitMessage(input)
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
              <div className={styles.panelSub}>Texto ou áudio — funciona no app instalado (PWA)</div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fechar">
              ✕
            </button>
          </header>

          <div className={styles.messages} ref={listRef}>
            {speech.transcribing && (
              <div className={styles.listeningHint} role="status">
                <span className={styles.listeningDot} aria-hidden />
                Transcrevendo áudio…
              </div>
            )}
            {speech.listening && !speech.transcribing && (
              <div className={styles.listeningHint} role="status">
                <span className={styles.listeningDot} aria-hidden />
                {speech.activeMode === 'record'
                  ? 'Gravando… fale e toque 🎤 para transcrever no campo'
                  : 'Falando… o texto aparece no campo. Toque 🎤 para parar e envie com ↑'}
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === 'user'
                    ? `${styles.bubble} ${styles.bubbleUser}`
                    : `${styles.bubble} ${styles.bubbleBot}`
                }
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <button
              type="button"
              className={
                speech.listening
                  ? `${styles.micBtn} ${styles.micBtnActive}`
                  : styles.micBtn
              }
              aria-label={speech.listening ? 'Parar gravação' : 'Falar gasto ou receita'}
              title={
                !speech.supported
                  ? 'Microfone indisponível (use HTTPS)'
                  : speech.listening
                    ? 'Parar'
                    : speech.mode === 'record'
                      ? 'Gravar áudio (Firefox/Safari)'
                      : 'Falar (ditado ao vivo)'
              }
              disabled={sending || speech.transcribing || !speech.supported}
              onClick={onMicClick}
            >
              🎤
            </button>
            <input
              ref={inputRef}
              type="text"
              className={
                speech.listening ? `${styles.input} ${styles.inputListening}` : styles.input
              }
              placeholder={speech.listening ? 'Escutando…' : 'Digite ou use o 🎤'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || speech.transcribing}
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
