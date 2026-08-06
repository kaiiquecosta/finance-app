import type { CommunityItem, CommunityItemStatus } from '@/domain/community'
import { COMMUNITY_COLUMNS } from '@/domain/community'

const STORAGE_KEY = 'flux_community_status_seen_v1'

type StoredMap = Record<string, CommunityItemStatus>

function readStored(): StoredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as StoredMap
  } catch {
    return {}
  }
}

function writeStored(map: StoredMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export type CommunityStatusAlert = {
  itemId: number
  title: string
  status: CommunityItemStatus
  previousStatus: CommunityItemStatus
}

let pushAlert: ((alert: CommunityStatusAlert) => void) | null = null

export function registerCommunityStatusAlertHandler(fn: ((alert: CommunityStatusAlert) => void) | null) {
  pushAlert = fn
}

/** Alerta imediato (ex.: autor online quando status muda). */
export function pushCommunityStatusAlert(alert: CommunityStatusAlert) {
  markCommunityStatusSeen(alert.itemId, alert.status)
  pushAlert?.(alert)
}

/** Compara status salvos e gera alertas só para sugestões do usuário logado. */
export function detectCommunityStatusAlerts(
  userId: string | undefined,
  items: CommunityItem[],
): CommunityStatusAlert[] {
  if (!userId) return []
  const mine = items.filter((i) => i.authorId === userId)
  if (mine.length === 0) return []

  const stored = readStored()
  const alerts: CommunityStatusAlert[] = []

  for (const item of mine) {
    const key = String(item.id)
    const prev = stored[key]
    if (prev == null) {
      stored[key] = item.status
      continue
    }
    if (prev !== item.status) {
      alerts.push({
        itemId: item.id,
        title: item.title,
        status: item.status,
        previousStatus: prev,
      })
      stored[key] = item.status
    }
  }

  writeStored(stored)
  return alerts
}

/** Atualiza o status “visto” sem alertar (ex.: após o autor criar a sugestão). */
export function markCommunityStatusSeen(itemId: number, status: CommunityItemStatus) {
  const stored = readStored()
  stored[String(itemId)] = status
  writeStored(stored)
}

export function communityStatusPopupCopy(
  status: CommunityItemStatus,
  title: string,
): { heading: string; body: string; icon: string } {
  const col = COMMUNITY_COLUMNS.find((c) => c.status === status)
  const columnTitle = col?.title ?? status

  switch (status) {
    case 'planned':
      return {
        icon: '📋',
        heading: 'Flux vai desenvolver seu pedido',
        body: `Sua sugestão “${title}” entrou em **${columnTitle}**. Priorizamos pelo interesse de quem usa o app — em breve trabalhamos nisso.`,
      }
    case 'in_progress':
      return {
        icon: '🍳',
        heading: 'Estamos cozinhando sua ideia',
        body: `O Flux está desenvolvendo “${title}”. Assim que estiver pronto, avisamos na coluna **Pronto**.`,
      }
    case 'done':
      return {
        icon: '✅',
        heading: 'Seu pedido ficou pronto',
        body: `“${title}” já está disponível no app. Vale testar e nos contar o que achou!`,
      }
    case 'backlog':
    default:
      return {
        icon: '💡',
        heading: 'Atualização na sua sugestão',
        body: `“${title}” foi movida para **${columnTitle}**. Seguimos acompanhando o interesse da comunidade.`,
      }
  }
}

/** Texto curto para toast quando admin altera status (feedback imediato). */
export function communityStatusAdminToast(status: CommunityItemStatus): string {
  switch (status) {
    case 'planned':
      return 'Movido para Faremos — o autor será avisado.'
    case 'in_progress':
      return 'Estamos cozinhando — o autor será avisado.'
    case 'done':
      return 'Marcado como Pronto — o autor será avisado.'
    default:
      return 'Status atualizado.'
  }
}
