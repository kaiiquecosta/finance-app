import { useCallback, useEffect, useState } from 'react'
import { useCommunityBoard } from '@/features/community/useCommunity'
import { useCommunityBoardSync } from '@/features/community/useCommunityBoardSync'
import {
  detectCommunityStatusAlerts,
  registerCommunityStatusAlertHandler,
  type CommunityStatusAlert,
} from '@/features/community/communityStatusNotify'
import { showCommunityStatusNotification } from '@/features/community/communityBrowserNotify'

function dedupeAlerts(list: CommunityStatusAlert[]): CommunityStatusAlert[] {
  const seen = new Set<string>()
  const out: CommunityStatusAlert[] = []
  for (const a of list) {
    const key = `${a.itemId}:${a.status}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

function enqueueAlerts(
  prev: CommunityStatusAlert[],
  incoming: CommunityStatusAlert[],
): CommunityStatusAlert[] {
  const merged = dedupeAlerts([...prev, ...incoming])
  for (const a of incoming) {
    showCommunityStatusNotification(a)
  }
  return merged
}

/** Detecta mudanças de status nas sugestões do usuário (autor), em qualquer rota do app. */
export function useCommunityStatusAlerts(userId: string | undefined) {
  useCommunityBoardSync(userId)
  const board = useCommunityBoard(userId)
  const [queue, setQueue] = useState<CommunityStatusAlert[]>([])

  const pushToQueue = useCallback((alert: CommunityStatusAlert) => {
    setQueue((q) => enqueueAlerts(q, [alert]))
  }, [])

  useEffect(() => {
    registerCommunityStatusAlertHandler(pushToQueue)
    return () => registerCommunityStatusAlertHandler(null)
  }, [pushToQueue])

  useEffect(() => {
    if (!userId || !board.data) return
    const alerts = detectCommunityStatusAlerts(userId, board.data)
    if (alerts.length > 0) {
      setQueue((q) => enqueueAlerts(q, alerts))
    }
  }, [userId, board.data])

  const dismissHead = () => setQueue((q) => q.slice(1))

  return { queue, dismissHead }
}
