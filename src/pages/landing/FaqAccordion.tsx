import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

type FaqItem = { q: string; a: string }

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function animatePanel(panel: HTMLElement, open: boolean) {
  const inner = panel.querySelector<HTMLElement>('.fa-inner')
  if (!inner) return

  gsap.killTweensOf(panel)

  if (open) {
    gsap.set(panel, { display: 'block' })
    const height = inner.offsetHeight + 20
    gsap.fromTo(
      panel,
      { height: 0, opacity: 0 },
      {
        height,
        opacity: 1,
        duration: 0.48,
        ease: 'power3.out',
        onComplete: () => {
          gsap.set(panel, { height: 'auto' })
        },
      },
    )
    gsap.fromTo(inner, { y: 10, filter: 'blur(4px)' }, { y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out' })
    return
  }

  gsap.to(panel, {
    height: 0,
    opacity: 0,
    duration: 0.34,
    ease: 'power2.inOut',
    onComplete: () => gsap.set(panel, { display: 'none' }),
  })
}

function animateIcon(icon: HTMLElement, open: boolean) {
  gsap.killTweensOf(icon)
  gsap.to(icon, {
    rotate: open ? 45 : 0,
    backgroundColor: open ? 'rgba(61,220,132,0.1)' : 'rgba(255,255,255,0.05)',
    borderColor: open ? 'rgba(61,220,132,0.22)' : 'rgba(255,255,255,0.07)',
    color: open ? '#3ddc84' : 'rgba(255,255,255,0.3)',
    duration: 0.38,
    ease: 'power3.out',
  })
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevOpen = useRef<number | null>(null)

  useEffect(() => {
    const root = listRef.current
    if (!root) return

    const reducedMotion = window.matchMedia(REDUCED_MOTION).matches
    const prev = prevOpen.current
    prevOpen.current = openIndex

    if (reducedMotion) {
      root.querySelectorAll<HTMLElement>('.faq').forEach((faq, i) => {
        faq.classList.toggle('open', openIndex === i)
      })
      return
    }

    if (prev !== null && prev !== openIndex) {
      const prevFaq = root.querySelectorAll<HTMLElement>('.faq')[prev]
      const prevPanel = prevFaq?.querySelector<HTMLElement>('.fa')
      const prevIcon = prevFaq?.querySelector<HTMLElement>('.fqx')
      prevFaq?.classList.remove('open')
      if (prevPanel) animatePanel(prevPanel, false)
      if (prevIcon) animateIcon(prevIcon, false)
    }

    if (openIndex === null) return

    const faq = root.querySelectorAll<HTMLElement>('.faq')[openIndex]
    const panel = faq?.querySelector<HTMLElement>('.fa')
    const icon = faq?.querySelector<HTMLElement>('.fqx')
    faq?.classList.add('open')
    if (panel) animatePanel(panel, true)
    if (icon) animateIcon(icon, true)
  }, [openIndex])

  const toggle = (index: number) => {
    setOpenIndex((cur) => (cur === index ? null : index))
  }

  return (
    <div className="flist" ref={listRef}>
      {items.map((item, i) => (
        <div className={`faq${openIndex === i ? ' open' : ''}`} key={item.q}>
          <button className="fq" type="button" onClick={() => toggle(i)} aria-expanded={openIndex === i}>
            {item.q}
            <div className="fqx">+</div>
          </button>
          <div className="fa" style={{ display: openIndex === i ? 'block' : 'none' }}>
            <div className="fa-inner">{item.a}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
