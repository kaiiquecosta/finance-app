import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const MOBILE = '(max-width: 720px)'

function setupInvChapter(root: HTMLElement) {
  const story = root.querySelector<HTMLElement>('[data-inv-story]')
  if (!story || window.matchMedia('(max-width: 860px)').matches) return

  const pin = story.querySelector<HTMLElement>('.inv-story-pin')
  const card = story.querySelector<HTMLElement>('[data-inv-card]')
  const checks = story.querySelectorAll<HTMLElement>('[data-inv-check]')
  const rows = story.querySelectorAll<HTMLElement>('[data-inv-row]')
  const dots = story.querySelectorAll<HTMLElement>('[data-inv-dot]')
  const beats = story.querySelectorAll<HTMLElement>('[data-inv-beat]')

  if (!pin || !card) return

  gsap.set(checks, { opacity: 0.15, y: 12 })
  gsap.set(card, { opacity: 0, x: 48, y: 24 })
  gsap.set(beats, { opacity: 0, y: 16 })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: story,
      start: 'top top',
      end: '+=280%',
      pin,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })

  if (beats[0]) tl.to(beats[0], { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0)
  checks.forEach((check, i) => {
    tl.to(check, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.06 + i * 0.04)
  })
  if (beats[1]) tl.to(beats[1], { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.28)
  tl.to(card, { opacity: 1, x: 0, y: 0, duration: 0.16, ease: 'power3.out' }, 0.34)
  if (beats[2]) tl.to(beats[2], { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.48)

  rows.forEach((row, i) => {
    const at = 0.56 + i * 0.07
    tl.to(row, { backgroundColor: 'rgba(61,220,132,0.1)', duration: 0.04 }, at)
    tl.to(row, { backgroundColor: 'rgba(61,220,132,0)', duration: 0.05 }, at + 0.05)
  })

  if (beats[3]) tl.to(beats[3], { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.88)

  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: '+=280%',
    scrub: 0.7,
    onUpdate: (self) => {
      const step = Math.min(dots.length - 1, Math.floor(self.progress * dots.length))
      dots.forEach((dot, i) => dot.classList.toggle('active', i <= step))
    },
  })
}

/**
 * Narrativa contínua via scroll — Lenis, capítulos, reveals e pin na seção de investimentos.
 */
export function useLandingStory(rootRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches
    const isMobile = window.matchMedia(MOBILE).matches

    root.classList.add('story-enabled')

    if (reducedMotion) {
      root.querySelectorAll('[data-story-reveal], [data-story-item]').forEach((el) => {
        el.classList.add('is-revealed')
      })
      return () => root.classList.remove('story-enabled')
    }

    let lenisRaf = 0
    let lenis: Lenis | null = null

    const ctx = gsap.context(() => {
      const progressBar = root.querySelector<HTMLElement>('.story-progress-bar')
      if (progressBar) {
        gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' })
        gsap.to(progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.25,
          },
        })
      }

      const chapterLabel = root.querySelector<HTMLElement>('.story-chapter-current')
      root.querySelectorAll<HTMLElement>('[data-story-chapter]').forEach((section) => {
        const name = section.dataset.storyChapter
        if (!name || !chapterLabel) return

        ScrollTrigger.create({
          trigger: section,
          start: 'top 52%',
          end: 'bottom 48%',
          onEnter: () => {
            chapterLabel.textContent = name
            chapterLabel.dataset.chapter = name
          },
          onEnterBack: () => {
            chapterLabel.textContent = name
            chapterLabel.dataset.chapter = name
          },
        })
      })

      const hero = root.querySelector<HTMLElement>('.hero')
      const heroContent = root.querySelector<HTMLElement>('.hero-c')
      const heroBg = root.querySelector<HTMLElement>('.hero-scene-stack')

      if (hero && heroContent) {
        gsap.to(heroContent, {
          y: 72,
          opacity: 0.15,
          scale: 0.94,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.55,
          },
        })
      }

      if (hero && heroBg) {
        gsap.to(heroBg, {
          y: 100,
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

      root.querySelectorAll<HTMLElement>('[data-story-reveal]').forEach((el) => {
        gsap.set(el, { opacity: 0, y: 36 })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 86%',
          once: true,
          onEnter: () => {
            el.classList.add('is-revealed')
            gsap.to(el, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' })
          },
        })
      })

      root.querySelectorAll<HTMLElement>('[data-story-stagger]').forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>('[data-story-item]')
        if (!items.length) return
        gsap.set(items, { opacity: 0, y: 28 })
        ScrollTrigger.create({
          trigger: group,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.07,
              ease: 'power3.out',
            })
            items.forEach((item) => item.classList.add('is-revealed'))
          },
        })
      })

      const ticker = root.querySelector<HTMLElement>('.ticker-wrap')
      if (ticker) {
        gsap.to(ticker, {
          y: -24,
          ease: 'none',
          scrollTrigger: {
            trigger: ticker,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
      }

      setupInvChapter(root)

      const fcta = root.querySelector<HTMLElement>('.fcta-box')
      if (fcta) {
        gsap.fromTo(
          fcta,
          { scale: 0.97, opacity: 0.85 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: fcta,
              start: 'top 92%',
              end: 'top 55%',
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
          duration: 1.08,
          smoothWheel: true,
          touchMultiplier: 1.2,
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
      ctx.revert()
      root.classList.remove('story-enabled')
    }
  }, [rootRef])
}
