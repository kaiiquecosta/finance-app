import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const FINE_POINTER = '(pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const MOBILE = '(max-width: 720px)'

/**
 * Orquestra a experiência cinematográfica da landing:
 * Lenis (desktop), intro do hero, scroll storytelling, magnetic CTAs,
 * tilt nos cards e cursor customizado.
 */
export function useLandingCinematic(rootRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches
    const finePointer = window.matchMedia(FINE_POINTER).matches
    const isMobile = window.matchMedia(MOBILE).matches

    root.classList.add('motion-enabled', 'cinematic-ready')

    const revealAll = () => {
      root.querySelectorAll('[data-motion]').forEach((el) => el.classList.add('is-visible'))
      gsap.set(root.querySelectorAll('[data-split-char], [data-split-word]'), {
        clearProps: 'all',
        opacity: 1,
      })
    }

    if (reducedMotion) {
      revealAll()
      return () => root.classList.remove('motion-enabled', 'cinematic-ready')
    }

    const cleanups: Array<() => void> = []
    let lenisRaf = 0
    let lenis: Lenis | null = null

    const ctx = gsap.context(() => {
      const heroIntro = gsap.timeline({ defaults: { ease: 'power4.out' } })

      const chars = root.querySelectorAll<HTMLElement>('[data-split-char]')
      if (chars.length) {
        gsap.set(chars, {
          opacity: 0,
          yPercent: 115,
          rotateX: -38,
          filter: 'blur(10px)',
          transformOrigin: '50% 100%',
        })
        heroIntro.to(
          chars,
          {
            opacity: 1,
            yPercent: 0,
            rotateX: 0,
            filter: 'blur(0px)',
            duration: 1.05,
            stagger: { each: 0.026, from: 'start' },
          },
          0.15,
        )
      }

      const heroSequence: Array<[string, number]> = [
        ['[data-motion="hero-pill"]', 0.48],
        ['[data-motion="hero-copy"]', 0.58],
        ['[data-motion="hero-actions"]', 0.68],
        ['[data-motion="hero-notes"]', 0.76],
        ['[data-motion="hero-mock"]', 0.62],
      ]

      heroSequence.forEach(([selector, at]) => {
        const el = root.querySelector<HTMLElement>(selector)
        if (!el) return
        gsap.set(el, { opacity: 0, y: 44, filter: 'blur(8px)' })
        heroIntro.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.95 }, at)
        heroIntro.add(() => el.classList.add('is-visible'), at + 0.95)
      })

      const hero = root.querySelector<HTMLElement>('.hero')
      const heroContent = root.querySelector<HTMLElement>('.hero-c')
      const heroScene = root.querySelector<HTMLElement>('.hero-scene-stack')
      const hglows = root.querySelectorAll<HTMLElement>('.hglow')

      if (hero && heroContent) {
        gsap.to(heroContent, {
          y: 52,
          opacity: 0.32,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.55,
          },
        })
      }

      if (hero && heroScene) {
        gsap.to(heroScene, {
          y: 90,
          scale: 1.06,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      if (hero && hglows.length) {
        gsap.to(hglows, {
          y: (i) => (i + 1) * 36,
          opacity: 0.45,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
      }

      root.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => {
        const motion = el.dataset.motion
        if (motion?.startsWith('hero-')) return

        if (motion === 'stagger') {
          const items = el.querySelectorAll<HTMLElement>('.fc, .st-cell, .pcard, .tcard')
          if (!items.length) return
          gsap.set(items, { opacity: 0, y: 38, filter: 'blur(5px)' })
          ScrollTrigger.create({
            trigger: el,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              el.classList.add('is-visible')
              gsap.to(items, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.88,
                stagger: 0.07,
                ease: 'power3.out',
              })
            },
          })
          return
        }

        if (motion === 'split') {
          const children = Array.from(el.children) as HTMLElement[]
          if (!children.length) return
          gsap.set(children, {
            opacity: 0,
            x: (index) => (index === 0 ? -42 : 42),
            filter: 'blur(4px)',
          })
          ScrollTrigger.create({
            trigger: el,
            start: 'top 80%',
            once: true,
            onEnter: () => {
              el.classList.add('is-visible')
              gsap.to(children, {
                opacity: 1,
                x: 0,
                filter: 'blur(0px)',
                duration: 1,
                stagger: 0.14,
                ease: 'power3.out',
              })
            },
          })
          return
        }

        gsap.set(el, { opacity: 0, y: 34, filter: 'blur(5px)' })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            el.classList.add('is-visible')
            gsap.to(el, {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.92,
              ease: 'power3.out',
            })
          },
        })
      })

      root.querySelectorAll<HTMLElement>('[data-split-words]').forEach((heading) => {
        const words = heading.querySelectorAll<HTMLElement>('[data-split-word]')
        if (!words.length) return
        gsap.set(words, { opacity: 0, y: '100%', filter: 'blur(6px)' })
        ScrollTrigger.create({
          trigger: heading,
          start: 'top 84%',
          once: true,
          onEnter: () => {
            gsap.to(words, {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.82,
              stagger: 0.045,
              ease: 'power3.out',
            })
          },
        })
      })

      const mock = root.querySelector<HTMLElement>('.mock')
      const frame = root.querySelector<HTMLElement>('.mock-frame')
      if (finePointer && mock && frame) {
        const resetTilt = () => {
          frame.style.setProperty('--mock-rx', '0deg')
          frame.style.setProperty('--mock-ry', '0deg')
          frame.style.setProperty('--mock-glare-x', '50%')
          frame.style.setProperty('--mock-glare-y', '20%')
        }
        const onPointerMove = (event: PointerEvent) => {
          const rect = mock.getBoundingClientRect()
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
          frame.style.setProperty('--mock-rx', `${(0.5 - y) * 2.8}deg`)
          frame.style.setProperty('--mock-ry', `${(x - 0.5) * 4}deg`)
          frame.style.setProperty('--mock-glare-x', `${x * 100}%`)
          frame.style.setProperty('--mock-glare-y', `${y * 100}%`)
        }
        mock.addEventListener('pointermove', onPointerMove, { passive: true })
        mock.addEventListener('pointerleave', resetTilt)
        cleanups.push(() => {
          mock.removeEventListener('pointermove', onPointerMove)
          mock.removeEventListener('pointerleave', resetTilt)
        })
      }

      if (finePointer) {
        root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
          gsap.set(el, { x: 0, y: 0 })
          const xTo = gsap.quickTo(el, 'x', { duration: 0.65, ease: 'power3.out' })
          const yTo = gsap.quickTo(el, 'y', { duration: 0.65, ease: 'power3.out' })
          const strength = Number(el.dataset.magneticStrength ?? 0.32)

          const onMove = (event: PointerEvent) => {
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            xTo((event.clientX - cx) * strength)
            yTo((event.clientY - cy) * strength)
          }
          const onLeave = () => {
            xTo(0)
            yTo(0)
          }
          const onDown = () => gsap.to(el, { scale: 0.96, duration: 0.12, ease: 'power2.out' })
          const onUp = () => gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)' })

          el.addEventListener('pointermove', onMove)
          el.addEventListener('pointerleave', onLeave)
          el.addEventListener('pointerdown', onDown)
          el.addEventListener('pointerup', onUp)
          el.addEventListener('pointercancel', onUp)

          cleanups.push(() => {
            el.removeEventListener('pointermove', onMove)
            el.removeEventListener('pointerleave', onLeave)
            el.removeEventListener('pointerdown', onDown)
            el.removeEventListener('pointerup', onUp)
            el.removeEventListener('pointercancel', onUp)
            gsap.set(el, { clearProps: 'all' })
          })
        })
      }

      if (finePointer) {
        root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
          const inner = card.querySelector<HTMLElement>('[data-tilt-inner]') ?? card
          gsap.set(inner, { transformPerspective: 900, transformStyle: 'preserve-3d' })
          const rxTo = gsap.quickTo(inner, 'rotateX', { duration: 0.55, ease: 'power2.out' })
          const ryTo = gsap.quickTo(inner, 'rotateY', { duration: 0.55, ease: 'power2.out' })
          const yTo = gsap.quickTo(inner, 'y', { duration: 0.55, ease: 'power2.out' })

          const onMove = (event: PointerEvent) => {
            const rect = card.getBoundingClientRect()
            const x = (event.clientX - rect.left) / rect.width - 0.5
            const y = (event.clientY - rect.top) / rect.height - 0.5
            rxTo(-y * 9)
            ryTo(x * 11)
            yTo(-4)
          }
          const onLeave = () => {
            rxTo(0)
            ryTo(0)
            yTo(0)
          }

          card.addEventListener('pointermove', onMove)
          card.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            card.removeEventListener('pointermove', onMove)
            card.removeEventListener('pointerleave', onLeave)
            gsap.set(inner, { clearProps: 'all' })
          })
        })
      }

      if (finePointer && !isMobile) {
        const dot = document.querySelector<HTMLElement>('.landing-cursor-dot')
        const ring = document.querySelector<HTMLElement>('.landing-cursor-ring')
        if (dot && ring) {
          document.body.classList.add('landing-cursor-active')
          gsap.set([dot, ring], { x: 0, y: 0, opacity: 0 })
          gsap.to([dot, ring], { opacity: 1, duration: 0.4, delay: 0.8 })

          const dotX = gsap.quickTo(dot, 'x', { duration: 0.18, ease: 'power3.out' })
          const dotY = gsap.quickTo(dot, 'y', { duration: 0.18, ease: 'power3.out' })
          const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' })
          const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' })

          const onMove = (event: PointerEvent) => {
            dotX(event.clientX)
            dotY(event.clientY)
            ringX(event.clientX)
            ringY(event.clientY)
          }

          const interactiveSelector =
            'a, button, [role="button"], input, textarea, select, [data-magnetic], .fc, .pcard, .tcard, .mock'
          const onOver = (event: Event) => {
            const target = event.target as HTMLElement | null
            if (!target?.closest(interactiveSelector)) return
            gsap.to(ring, { scale: 1.65, borderColor: 'rgba(61,220,132,0.55)', duration: 0.35, ease: 'power2.out' })
            gsap.to(dot, { scale: 0.55, duration: 0.25, ease: 'power2.out' })
          }
          const onOut = (event: Event) => {
            const related = (event as PointerEvent).relatedTarget as Node | null
            if (related && (event.target as HTMLElement)?.closest(interactiveSelector)?.contains(related)) return
            gsap.to(ring, { scale: 1, borderColor: 'rgba(255,255,255,0.35)', duration: 0.4, ease: 'power2.out' })
            gsap.to(dot, { scale: 1, duration: 0.35, ease: 'power2.out' })
          }

          window.addEventListener('pointermove', onMove, { passive: true })
          root.addEventListener('pointerover', onOver)
          root.addEventListener('pointerout', onOut)

          cleanups.push(() => {
            window.removeEventListener('pointermove', onMove)
            root.removeEventListener('pointerover', onOver)
            root.removeEventListener('pointerout', onOut)
            document.body.classList.remove('landing-cursor-active')
          })
        }
      }

      const scrollThumb = root.querySelector<HTMLElement>('.scroll-indicator-thumb')
      if (scrollThumb) {
        gsap.to(scrollThumb, {
          y: 16,
          duration: 1.35,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }

      const dsec = root.querySelector<HTMLElement>('.dsec')
      if (dsec) {
        gsap.fromTo(
          dsec,
          { borderRadius: 36 },
          {
            borderRadius: 22,
            ease: 'none',
            scrollTrigger: {
              trigger: dsec,
              start: 'top 90%',
              end: 'top 40%',
              scrub: 0.5,
            },
          },
        )
      }
    }, root)

    const bootLenis = async () => {
      if (isMobile) {
        ScrollTrigger.refresh()
        return
      }

      try {
        const { default: LenisCtor } = await import('lenis')
        const instance = new LenisCtor({
          duration: 1.12,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.4,
        })
        lenis = instance

        instance.on('scroll', ScrollTrigger.update)

        const raf = (time: number) => {
          instance.raf(time)
          lenisRaf = requestAnimationFrame(raf)
        }
        lenisRaf = requestAnimationFrame(raf)
        ScrollTrigger.refresh()
      } catch {
        ScrollTrigger.refresh()
      }
    }

    void bootLenis()

    return () => {
      cancelAnimationFrame(lenisRaf)
      lenis?.destroy()
      cleanups.forEach((fn) => fn())
      ctx.revert()
      root.classList.remove('motion-enabled', 'cinematic-ready')
      document.body.classList.remove('landing-cursor-active')
    }
  }, [rootRef])
}
