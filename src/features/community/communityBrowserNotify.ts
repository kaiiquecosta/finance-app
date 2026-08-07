import type { CommunityStatusAlert } from './communityStatusNotify'
import { communityStatusPopupCopy } from './communityStatusNotify'

export function canUseBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Pede permissão uma vez (ideal ao abrir Comunidade). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!canUseBrowserNotifications()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showCommunityStatusNotification(alert: CommunityStatusAlert): void {
  if (!canUseBrowserNotifications() || Notification.permission !== 'granted') return
  const copy = communityStatusPopupCopy(alert.status, alert.title)
  const body = copy.body.replace(/\*\*/g, '')
  try {
    const n = new Notification(`Flux · Comunidade`, {
      body: `${copy.heading}\n${body}`,
      tag: `flux-community-${alert.itemId}-${alert.status}`,
    })
    n.onclick = () => {
      window.focus()
      if (window.location.pathname !== '/app/comunidade') {
        window.location.assign('/app/comunidade')
      }
      n.close()
    }
  } catch {
    /* ignore — Safari/iOS podem falhar silenciosamente */
  }
}
