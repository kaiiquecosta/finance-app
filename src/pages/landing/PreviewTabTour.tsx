import { useLayoutEffect, useState, type MutableRefObject, type RefObject } from 'react'
import type { PreviewId } from './previewTourSteps'

type PreviewTabTourProps = {
  active: boolean
  stepIndex: number
  totalSteps: number
  tabId: PreviewId
  title: string
  message: string
  tabRefs: MutableRefObject<Partial<Record<PreviewId, HTMLButtonElement>>>
  anchorRef: RefObject<HTMLElement | null>
  onNext: () => void
  onDismiss: () => void
}

export function PreviewTabTour({
  active,
  stepIndex,
  totalSteps,
  tabId,
  title,
  message,
  tabRefs,
  anchorRef,
  onNext,
  onDismiss,
}: PreviewTabTourProps) {
  const [callout, setCallout] = useState({ left: 0, top: 0, ready: false })

  useLayoutEffect(() => {
    if (!active) {
      setCallout({ left: 0, top: 0, ready: false })
      return
    }

    let raf = 0
    let attempts = 0

    const place = () => {
      const tab = tabRefs.current[tabId]
      const anchor = anchorRef.current
      if (!tab || !anchor) {
        if (attempts < 12) {
          attempts += 1
          raf = window.requestAnimationFrame(place)
        }
        return
      }

      const tabBox = tab.getBoundingClientRect()
      const anchorBox = anchor.getBoundingClientRect()
      const calloutWidth = Math.min(320, anchorBox.width - 24)
      const rawLeft = tabBox.left - anchorBox.left + tabBox.width / 2
      const minLeft = calloutWidth / 2 + 12
      const maxLeft = anchorBox.width - calloutWidth / 2 - 12
      const left = Math.max(minLeft, Math.min(maxLeft, rawLeft))
      const top = tabBox.bottom - anchorBox.top + 16

      setCallout({ left, top, ready: true })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [active, stepIndex, tabId, tabRefs, anchorRef])

  if (!active) return null

  const isLast = stepIndex >= totalSteps - 1

  return (
    <div
      className={`lp-tour-callout${callout.ready ? ' is-ready' : ''}`}
      style={{ left: callout.left, top: callout.top, width: 'min(320px, calc(100% - 24px))' }}
      role="dialog"
      aria-labelledby="lp-tour-title"
      aria-live="polite"
    >
      <div className="lp-tour-callout__progress" aria-hidden>
        {Array.from({ length: totalSteps }, (_, index) => (
          <span key={index} className={index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''} />
        ))}
      </div>
      <span className="lp-tour-callout__eyebrow">
        {stepIndex + 1} de {totalSteps}
      </span>
      <h4 className="lp-tour-callout__title" id="lp-tour-title">
        {title}
      </h4>
      <p>{message}</p>
      <div className="lp-tour-callout__actions">
        <button type="button" className="lp-tour-callout__next" onClick={onNext}>
          {isLast ? 'Concluir' : 'Continuar'}
        </button>
        <button type="button" className="lp-tour-callout__skip" onClick={onDismiss}>
          Pular tour
        </button>
      </div>
    </div>
  )
}
