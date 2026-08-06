import { useEffect, useState } from 'react'
import { useCommunityBoard } from '@/features/community/useCommunity'
import {
  detectCommunityStatusAlerts,
  registerCommunityStatusAlertHandler,
  type CommunityStatusAlert,
} from '@/features/community/communityStatusNotify'

/** Detecta mudanças de status nas sugestões do usuário (autor). */
export function useCommunityStatusAlerts(userId: string | undefined) {
  const board = useCommunityBoard(userId)
  const [queue, setQueue] = useState<CommunityStatusAlert[]>([])

  useEffect(() => {
    registerCommunityStatusAlertHandler((alert) => {
      setQueue((q) => [...q, alert])
    })
    return () => registerCommunityStatusAlertHandler(null)
  }, [])

  useEffect(() => {
    if (!userId || !board.data) return
    const alerts = detectCommunityStatusAlerts(userId, board.data)
    if (alerts.length > 0) setQueue((q) => [...q, ...alerts])
  }, [userId, board.data])

  const dismissHead = () => setQueue((q) => q.slice(1))

  return { queue, dismissHead }
}
