import { useLayoutEffect, useState, type MutableRefObject, type RefObject } from 'react'
import type { PreviewId } from './previewTourSteps'

type PreviewTabTourProps = {
  active: boolean
  stepIndex: number
  tabId: PreviewId
  message: string
  stepLabel: string
  tabRefs: MutableRefObject<Partial<Record<PreviewId, HTMLButtonElement>>>
  anchorRef: RefObject<HTMLElement | null>
  onNext: () => void
  onDismiss: () => void
}

export function PreviewTabTour({
  active,
  stepIndex,
  tabId,
  message,
  stepLabel,
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
      const calloutWidth = Math.min(300, anchorBox.width - 16)
      const rawLeft = tabBox.left - anchorBox.left + tabBox.width / 2
      const minLeft = calloutWidth / 2 + 8
      const maxLeft = anchorBox.width - calloutWidth / 2 - 8
      const left = Math.max(minLeft, Math.min(maxLeft, rawLeft))
      const top = tabBox.bottom - anchorBox.top + 12

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

  return (
    <div
      className={`lp-tour-callout${callout.ready ? ' is-ready' : ''}`}
      style={{ left: callout.left, top: callout.top }}
      role="status"
      aria-live="polite"
    >
      <span className="lp-tour-callout__step">{stepLabel}</span>
      <p>{message}</p>
      <div className="lp-tour-callout__actions">
        <button type="button" className="lp-tour-callout__next" onClick={onNext}>
          Próximo
        </button>
        <button type="button" className="lp-tour-callout__skip" onClick={onDismiss}>
          Pular tour
        </button>
      </div>
    </div>
  )
}
