import { useEffect, useState, type RefObject } from 'react'

/** Só fica true quando a seção está realmente visível na viewport (não basta encostar). */
export function useScrollVisible(
  ref: RefObject<Element | null>,
  minRatio = 0.42,
  rootMargin = '0px 0px -6% 0px',
) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio >= minRatio))
      },
      { threshold: [0, 0.15, 0.35, minRatio, 0.55, 0.75, 1], rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, minRatio, rootMargin])

  return visible
}

export type DemoSectionFocusOptions = {
  /** Topo do bloco precisa estar acima desta fração da tela (evita “peek” pela base). */
  topMax?: number
  /** Base do bloco precisa estar abaixo desta fração da tela (evita bloco já scrollado para cima). */
  bottomMin?: number
  /** Mínimo de pixels visíveis na viewport. */
  minVisiblePx?: number
}

function measureDemoSectionFocused(el: Element, options: DemoSectionFocusOptions): boolean {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  const topMax = options.topMax ?? 0.5
  const bottomMin = options.bottomMin ?? 0.12
  const minVisiblePx = options.minVisiblePx ?? 140

  const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
  if (visiblePx < minVisiblePx) return false
  if (rect.top > vh * topMax) return false
  if (rect.bottom < vh * bottomMin) return false
  return true
}

/**
 * Demo da landing em foco — não dispara quando a seção só encosta na base da tela
 * (ex.: usuário já voltou para Investimentos / mock do hero).
 */
export function useDemoSectionFocused(
  ref: RefObject<Element | null>,
  options: DemoSectionFocusOptions = {},
) {
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      setFocused(measureDemoSectionFocused(el, options))
    }

    check()
    window.addEventListener('scroll', check, { passive: true, capture: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      window.removeEventListener('scroll', check, true)
      window.removeEventListener('resize', check)
    }
  }, [ref, options.topMax, options.bottomMin, options.minVisiblePx])

  return focused
}
