import { useEffect, useState, type RefObject } from 'react'

/** Só fica true quando a seção está realmente visível na viewport (não basta encostar). */
export function useScrollVisible(ref: RefObject<Element | null>, minRatio = 0.42) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(Boolean(entry?.isIntersecting && entry.intersectionRatio >= minRatio))
      },
      { threshold: [0, 0.15, 0.35, minRatio, 0.55, 0.75, 1], rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, minRatio])

  return visible
}
