import { useEffect, type RefObject } from 'react'

/**
 * Coreografia progressiva da landing:
 * - revela blocos quando entram no viewport;
 * - adiciona perspectiva sutil ao mockup em ponteiros precisos;
 * - desativa movimento para quem prefere animações reduzidas.
 */
export function useLandingMotion(rootRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const motionTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-motion]'))
    root.classList.add('motion-enabled')

    if (reducedMotion || !('IntersectionObserver' in window)) {
      motionTargets.forEach((element) => element.classList.add('is-visible'))
      return () => root.classList.remove('motion-enabled')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
    )
    motionTargets.forEach((element) => observer.observe(element))

    const mock = root.querySelector<HTMLElement>('.mock')
    const frame = root.querySelector<HTMLElement>('.mock-frame')
    const canTilt = window.matchMedia('(pointer: fine)').matches

    const resetTilt = () => {
      frame?.style.setProperty('--mock-rx', '0deg')
      frame?.style.setProperty('--mock-ry', '0deg')
      frame?.style.setProperty('--mock-glare-x', '50%')
      frame?.style.setProperty('--mock-glare-y', '20%')
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!mock || !frame) return
      const rect = mock.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
      frame.style.setProperty('--mock-rx', `${(0.5 - y) * 2.5}deg`)
      frame.style.setProperty('--mock-ry', `${(x - 0.5) * 3.5}deg`)
      frame.style.setProperty('--mock-glare-x', `${x * 100}%`)
      frame.style.setProperty('--mock-glare-y', `${y * 100}%`)
    }

    if (canTilt && mock && frame) {
      mock.addEventListener('pointermove', onPointerMove, { passive: true })
      mock.addEventListener('pointerleave', resetTilt)
    }

    const hero = root.querySelector<HTMLElement>('.hero')
    const heroContent = root.querySelector<HTMLElement>('.hero-c')

    const onScrollParallax = () => {
      if (!hero || !heroContent) return
      const rect = hero.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)))
      heroContent.style.transform = `translate3d(0, ${progress * 28}px, 0)`
      heroContent.style.opacity = String(Math.max(0.35, 1 - progress * 0.55))
    }
    onScrollParallax()
    window.addEventListener('scroll', onScrollParallax, { passive: true })

    return () => {
      observer.disconnect()
      root.classList.remove('motion-enabled')
      window.removeEventListener('scroll', onScrollParallax)
      if (heroContent) {
        heroContent.style.transform = ''
        heroContent.style.opacity = ''
      }
      mock?.removeEventListener('pointermove', onPointerMove)
      mock?.removeEventListener('pointerleave', resetTilt)
    }
  }, [rootRef])
}
