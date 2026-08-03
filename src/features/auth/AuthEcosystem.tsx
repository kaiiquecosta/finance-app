/**
 * Camada decorativa da tela de auth: chips do ecossistema ligados ao card por
 * curvas finas — a composição da referência (AbacatePay), na linguagem do Flux.
 *
 * GEOMETRIA (a razão de tudo estar num palco de tamanho FIXO em px):
 * o palco é ancorado no CARD, não na viewport. `.stack` é um grid cujo único
 * filho em fluxo é o card, então a caixa do `.stack` É a caixa do card; centrar
 * o palco nele equivale a centrar no card em X e Y — qualquer que seja a altura
 * do passo (login 557px, register 602px, verify ~300px). Nenhum ResizeObserver,
 * nenhuma medição em runtime, zero layout shift ao trocar de passo.
 *
 * Como o <svg> tem width/height iguais ao viewBox, a escala é exatamente 1:
 * nada de distorção anisotrópica (o motivo de não usar preserveAspectRatio="none").
 *
 * REGRA DOS RÓTULOS: só entram recursos/integrações que o código sustenta.
 * Proibidos por auditoria (não existem no app): Pix, Boleto, Open Finance,
 * iOS, push, offline, tempo real, ações B3, criptografia, IA.
 */
import type { CSSProperties, ReactElement } from 'react'
import type { Theme } from '@/app/theme'
import styles from './AuthScreen.module.css'

const STAGE = { w: 1120, h: 720 } as const
/** Mantido em sincronia com --card-w em AuthScreen.module.css (`.screen`). */
const CARD_W = 440

const EDGE = { left: (STAGE.w - CARD_W) / 2, right: (STAGE.w + CARD_W) / 2 } // 340 / 780
/**
 * 14px POR DENTRO da borda: o card é opaco e fica acima, então a ponta some sob
 * ele. A folga é generosa de propósito — o fio deriva horizontalmente junto com
 * o chip (--drift), e com só 4px de entrada a ponta poderia espiar para fora.
 */
const PORT_INSET = 14
const PORT_X = { left: EDGE.left + PORT_INSET, right: EDGE.right - PORT_INSET }
const PORT_Y = STAGE.h / 2 // 360 = meio do card, sempre
const PER_SIDE = 7
/**
 * Os fios não convergem todos num ponto (viraria starburst): chegam num leque
 * de ±84px em volta do centro. 168px de banda cabem dentro do card mais BAIXO
 * (~300px no passo verify), então nenhuma ponta escapa em nenhum passo.
 */
const FAN_STEP = 28

const STROKE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const ICON = {
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
      <path d="M3 9.5h18M9.5 21V9.5" />
    </>
  ),
  swap: <path d="M7 18V6L4.2 8.8M7 6l2.8 2.8M17 6v12l2.8-2.8M17 18l-2.8-2.8" />,
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M2.5 10h19" />
    </>
  ),
  layers: <path d="M12 3.5 3 8l9 4.5L21 8zM3 12.5 12 17l9-4.5" />,
  repeat: (
    <path d="m17 2.5 3.5 3.5L17 9.5M20.5 6h-13A3.5 3.5 0 0 0 4 9.5V11M7 21.5 3.5 18 7 14.5M3.5 18h13A3.5 3.5 0 0 0 20 14.5V13" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.8" />
    </>
  ),
  trend: <path d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5M15.5 5.5H21V11" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3.5" />
      <path d="M3 10h18M8 2.5V6M16 2.5V6" />
    </>
  ),
  percent: (
    <>
      <path d="M18.5 5.5 5.5 18.5" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  receipt: (
    <path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8zM14 2.5V8h5.5M8.5 14.5l2.2 2.2 4.3-4.3" />
  ),
  pulse: <path d="M2.5 12H7l2.5-7 4 14L16 12h5.5" />,
  exchange: <path d="M8 3.5 4 7.5l4 4M4 7.5h13M16 20.5l4-4-4-4M20 16.5H7" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M9.5 9.75h5M9.5 14.25h5" />
    </>
  ),
  shield: (
    <path d="M12 2.5 20 5.5V11c0 4.6-3.3 7.9-8 9.5-4.7-1.6-8-4.9-8-9.5V5.5zM8.8 12l2.3 2.3 4.1-4.3" />
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
} satisfies Record<string, ReactElement>

interface Chip {
  readonly label: string
  /** distância entre a borda do card e a borda INTERNA do chip, em px do palco */
  readonly x: number
  /** y do centro do chip (0 = topo do palco, 360 = meio do card) */
  readonly y: number
  readonly icon: keyof typeof ICON
}

/**
 * Os x formam um ARCO: chips nos extremos verticais ficam mais LONGE do card,
 * os do meio mais perto. Isso mantém a distância horizontal proporcional à
 * vertical em todos os fios (sem curvas quase verticais com toco horizontal) e
 * abre o leque naturalmente.
 *
 * Folga conferida: cada chip tem `max-width: calc(100% - var(--x) - 10px)`, ou
 * seja `330 - x` px. Os rótulos mais largos ficam onde x é menor. Pior caso:
 * "Mercado ao vivo" (~150px) em x=92 → 238px disponíveis.
 */
const LEFT: readonly Chip[] = [
  { label: 'Cartões', x: 188, y: 58, icon: 'card' },
  { label: 'Transações', x: 140, y: 156, icon: 'swap' },
  { label: 'Investimentos', x: 96, y: 256, icon: 'trend' },
  { label: 'Visão geral', x: 84, y: 360, icon: 'grid' },
  { label: 'Assinaturas', x: 104, y: 462, icon: 'repeat' },
  { label: 'Parcelas', x: 150, y: 562, icon: 'layers' },
  { label: 'Metas', x: 194, y: 660, icon: 'target' },
]

const RIGHT: readonly Chip[] = [
  { label: 'Cripto', x: 190, y: 58, icon: 'coin' },
  { label: 'CDI real', x: 136, y: 156, icon: 'percent' },
  { label: 'Mercado ao vivo', x: 92, y: 256, icon: 'pulse' },
  { label: '30 dias grátis', x: 80, y: 360, icon: 'calendar' },
  { label: 'IR automático', x: 100, y: 462, icon: 'receipt' },
  { label: 'Câmbio', x: 146, y: 562, icon: 'exchange' },
  { label: 'LGPD', x: 196, y: 660, icon: 'shield' },
]

const RAILS = [
  { side: 'left' as const, chips: LEFT, railCls: styles.railLeft, grad: 'authWireL' },
  { side: 'right' as const, chips: RIGHT, railCls: styles.railRight, grad: 'authWireR' },
]

/**
 * Cúbica com tangente HORIZONTAL nas duas pontas: sai do chip na direção do
 * card e entra na porta paralela à borda. Com b = dx/2 os dois pontos de
 * controle caem no mesmo x (o meio), o que dá a sigmoide suave e impossibilita
 * o cruzamento que geraria kink.
 *
 * sx vem do MESMO x que posiciona o chip no CSS, então a ponta do fio coincide
 * com a borda interna do chip por construção — inclusive se o rótulo crescer.
 */
function wire(c: Chip, i: number, side: 'left' | 'right'): string {
  const sx = side === 'left' ? EDGE.left - c.x : EDGE.right + c.x
  const px = side === 'left' ? PORT_X.left : PORT_X.right
  const ty = PORT_Y + (i - (PER_SIDE - 1) / 2) * FAN_STEP
  const b = (px - sx) * 0.5
  return `M${sx} ${c.y}C${sx + b} ${c.y} ${px - b} ${ty} ${px} ${ty}`
}

/**
 * Duas camadas de propósito: a âncora fixa a posição no trilho e faz a entrada,
 * o pill dentro dela flutua. Separar permite que entrada e flutuação usem cada
 * uma o seu `transform`, sem que a infinita sobrescreva a de entrada.
 */
function ChipPill({ chip, i }: { chip: Chip; i: number }) {
  return (
    <span
      className={styles.chipAnchor}
      style={{ '--x': `${chip.x}px`, '--y': `${chip.y}px`, '--i': i } as CSSProperties}
    >
      <span className={styles.chip}>
        <svg {...STROKE} className={styles.chipIcon} width="15" height="15">
          {ICON[chip.icon]}
        </svg>
        {chip.label}
      </span>
    </span>
  )
}

/** 100% decorativo: aria-hidden, pointer-events:none, nada focável. */
export function AuthEcosystem() {
  return (
    <div className={styles.decor} aria-hidden="true">
      <svg
        className={styles.wires}
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        width={STAGE.w}
        height={STAGE.h}
        focusable="false"
      >
        <defs>
          {/* userSpaceOnUse: coordenadas em unidades do palco. O fio nasce
              discreto na periferia e chega verde na borda do card. */}
          <linearGradient
            id="authWireL"
            gradientUnits="userSpaceOnUse"
            x1="120"
            y1="0"
            x2="344"
            y2="0"
          >
            <stop className={styles.stopFar} offset="0%" />
            <stop className={styles.stopMid} offset="55%" />
            <stop className={styles.stopNear} offset="100%" />
          </linearGradient>
          <linearGradient
            id="authWireR"
            gradientUnits="userSpaceOnUse"
            x1="1000"
            y1="0"
            x2="776"
            y2="0"
          >
            <stop className={styles.stopFar} offset="0%" />
            <stop className={styles.stopMid} offset="55%" />
            <stop className={styles.stopNear} offset="100%" />
          </linearGradient>
        </defs>
        {/* Cada fio vai num <g> que flutua com a MESMA duração e fase do seu
            chip (mesma fórmula sobre --i e --s), então a curva acompanha o pill
            e o ponto de solda nunca descola. A outra ponta se move junto, mas
            está escondida sob o card — 4px dentro da borda. */}
        {RAILS.map((r, si) =>
          r.chips.map((c, i) => (
            <g
              key={`${r.side}-${c.label}`}
              className={styles.wireFloat}
              style={{ '--i': i, '--s': si } as CSSProperties}
            >
              <path
                className={styles.wire}
                d={wire(c, i, r.side)}
                pathLength={1}
                stroke={`url(#${r.grad})`}
                style={{ '--i': i } as CSSProperties}
              />
            </g>
          )),
        )}
      </svg>
      {RAILS.map((r) => (
        <div key={r.side} className={`${styles.rail} ${r.railCls}`}>
          {r.chips.map((c, i) => (
            <ChipPill key={c.label} chip={c} i={i} />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Abaixo de 1200px o palco não é renderizado (os chips competiriam com o
 * formulário). A maioria dos cadastros novos chega por celular, então o passo
 * `register` — e só ele — recebe uma fita condensada: quem já tem conta quer
 * entrar, não ser convencido.
 */
const STRIP: readonly Chip[] = [
  { label: '30 dias grátis', x: 0, y: 0, icon: 'calendar' },
  { label: 'Cartões', x: 0, y: 0, icon: 'card' },
  { label: 'Investimentos', x: 0, y: 0, icon: 'trend' },
  { label: 'CDI real', x: 0, y: 0, icon: 'percent' },
  { label: 'LGPD', x: 0, y: 0, icon: 'shield' },
]

export function AuthStrip() {
  return (
    <div className={styles.strip} aria-hidden="true">
      {STRIP.map((c) => (
        <span key={c.label} className={styles.stripChip}>
          <svg {...STROKE} className={styles.chipIcon} width="14" height="14">
            {ICON[c.icon]}
          </svg>
          {c.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Alternador de tema no topo da tela. O padrão do app é o claro (theme.ts), e
 * este botão persiste a escolha em localStorage — vale para o app todo, não só
 * para esta tela. O rótulo anuncia a AÇÃO ("Modo escuro" quando você está no
 * claro), que é o que o usuário espera de um botão.
 */
export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const goingDark = theme === 'light'
  const label = goingDark ? 'Modo escuro' : 'Modo claro'
  return (
    <button type="button" className={styles.themeToggle} onClick={onToggle} title={label}>
      <svg {...STROKE} width="15" height="15" aria-hidden="true">
        {goingDark ? ICON.moon : ICON.sun}
      </svg>
      {label}
    </button>
  )
}

/** G oficial de 4 cores. Hex de marca do Google — não tematizar. */
export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
