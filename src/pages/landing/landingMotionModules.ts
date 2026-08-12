import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Scroll pinning estilo Oryzo na seção de investimentos (desktop). */
export function setupInvStory(root: HTMLElement) {
  const story = root.querySelector<HTMLElement>('[data-inv-story]')
  if (!story || window.matchMedia('(max-width: 860px)').matches) return

  const pin = story.querySelector<HTMLElement>('.inv-story-pin')
  const card = story.querySelector<HTMLElement>('[data-inv-card]')
  const checks = story.querySelectorAll<HTMLElement>('[data-inv-check]')
  const rows = story.querySelectorAll<HTMLElement>('[data-inv-row]')
  const dots = story.querySelectorAll<HTMLElement>('[data-inv-dot]')
  const headline = story.querySelector<HTMLElement>('[data-inv-headline]')
  const sub = story.querySelector<HTMLElement>('[data-inv-sub]')

  if (!pin || !card) return

  gsap.set(checks, { opacity: 0.2, x: -18, filter: 'blur(3px)' })
  gsap.set(card, {
    opacity: 0,
    x: 72,
    rotateY: -12,
    filter: 'blur(10px)',
    transformPerspective: 1000,
  })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: story,
      start: 'top top',
      end: '+=300%',
      pin,
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })

  if (headline) tl.fromTo(headline, { filter: 'blur(4px)' }, { filter: 'blur(0px)', duration: 0.08, ease: 'power2.out' }, 0)
  if (sub) tl.fromTo(sub, { opacity: 0.7 }, { opacity: 1, duration: 0.06, ease: 'power2.out' }, 0.02)

  checks.forEach((check, i) => {
    tl.to(
      check,
      { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.06, ease: 'power2.out' },
      0.08 + i * 0.035,
    )
  })

  tl.to(
    card,
    {
      opacity: 1,
      x: 0,
      rotateY: 0,
      filter: 'blur(0px)',
      duration: 0.18,
      ease: 'power3.out',
    },
    0.32,
  )

  rows.forEach((row, i) => {
    const at = 0.52 + i * 0.06
    tl.to(row, { backgroundColor: 'rgba(61,220,132,0.09)', scale: 1.008, duration: 0.04, ease: 'power1.out' }, at)
    tl.to(row, { backgroundColor: 'rgba(61,220,132,0)', scale: 1, duration: 0.05, ease: 'power1.inOut' }, at + 0.05)
  })

  tl.to(
    card,
    {
      scale: 1.025,
      boxShadow: '0 32px 90px rgba(61,220,132,0.14), 0 8px 32px rgba(0,0,0,0.08)',
      duration: 0.14,
      ease: 'power2.out',
    },
    0.82,
  )

  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: '+=300%',
    scrub: 0.65,
    onUpdate: (self) => {
      const step = Math.min(3, Math.floor(self.progress * 4))
      dots.forEach((dot, i) => dot.classList.toggle('active', i <= step))
    },
  })
}

const NAV_SECTIONS = [
  { id: 'funcionalidades', href: '#funcionalidades' },
  { id: 'investimentos', href: '#investimentos' },
  { id: 'precos', href: '#precos' },
  { id: 'faq', href: '#faq' },
]

/** Links da nav com magnetismo sutil, underline e scroll spy. */
export function setupNavLinks(root: HTMLElement, finePointer: boolean): Array<() => void> {
  const cleanups: Array<() => void> = []
  const links = root.querySelectorAll<HTMLElement>('[data-nav-magnetic]')
  if (!links.length) return cleanups

  links.forEach((link) => {
    const line = link.querySelector<HTMLElement>('.nav-link-line')
    const text = link.querySelector<HTMLElement>('.nav-link-text') ?? link

    gsap.set(line, { scaleX: 0, transformOrigin: 'center' })

    const onEnter = () => {
      gsap.to(line, { scaleX: 1, duration: 0.42, ease: 'power3.out' })
      gsap.to(text, { y: -1, duration: 0.35, ease: 'power2.out' })
    }
    const onLeave = () => {
      if (!link.classList.contains('is-active')) {
        gsap.to(line, { scaleX: 0, duration: 0.32, ease: 'power2.inOut' })
      }
      gsap.to(text, { y: 0, duration: 0.35, ease: 'power2.out' })
    }

    link.addEventListener('pointerenter', onEnter)
    link.addEventListener('pointerleave', onLeave)
    cleanups.push(() => {
      link.removeEventListener('pointerenter', onEnter)
      link.removeEventListener('pointerleave', onLeave)
      gsap.set(link, { clearProps: 'all' })
    })

    if (finePointer) {
      const xTo = gsap.quickTo(link, 'x', { duration: 0.55, ease: 'power3.out' })
      const yTo = gsap.quickTo(link, 'y', { duration: 0.55, ease: 'power3.out' })
      const strength = 0.18

      const onMove = (event: PointerEvent) => {
        const rect = link.getBoundingClientRect()
        xTo((event.clientX - (rect.left + rect.width / 2)) * strength)
        yTo((event.clientY - (rect.top + rect.height / 2)) * strength)
      }
      const onMoveLeave = () => {
        xTo(0)
        yTo(0)
      }

      link.addEventListener('pointermove', onMove)
      link.addEventListener('pointerleave', onMoveLeave)
      cleanups.push(() => {
        link.removeEventListener('pointermove', onMove)
        link.removeEventListener('pointerleave', onMoveLeave)
      })
    }
  })

  NAV_SECTIONS.forEach(({ id, href }) => {
    const section = root.querySelector(`#${id}`)
    const link = root.querySelector<HTMLElement>(`[data-nav-magnetic][href="${href}"]`)
    if (!section || !link) return

    const line = link.querySelector<HTMLElement>('.nav-link-line')
    ScrollTrigger.create({
      trigger: section,
      start: 'top 38%',
      end: 'bottom 38%',
      onEnter: () => {
        links.forEach((l) => l.classList.remove('is-active'))
        link.classList.add('is-active')
        gsap.to(line, { scaleX: 1, duration: 0.35, ease: 'power2.out' })
      },
      onEnterBack: () => {
        links.forEach((l) => l.classList.remove('is-active'))
        link.classList.add('is-active')
        gsap.to(line, { scaleX: 1, duration: 0.35, ease: 'power2.out' })
      },
      onLeave: () => {
        link.classList.remove('is-active')
        gsap.to(line, { scaleX: 0, duration: 0.28, ease: 'power2.inOut' })
      },
      onLeaveBack: () => {
        link.classList.remove('is-active')
        gsap.to(line, { scaleX: 0, duration: 0.28, ease: 'power2.inOut' })
      },
    })
  })

  return cleanups
}
