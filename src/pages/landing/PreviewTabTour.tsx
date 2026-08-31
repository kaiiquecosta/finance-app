import { useLayoutEffect, useState, type MutableRefObject, type RefObject } from 'react'
import type { PreviewId } from './previewTourSteps'

type PreviewTabTourProps = {
  active: boolean
  stepIndex: number
  tabId: PreviewId
  message: string
  stepLabel: string
  tabRefs: MutableRefObject<Partial<Record<PreviewId, HTMLButtonElement>>>
  wrapRef: RefObject<HTMLDivElement | null>
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
  wrapRef,
  onNext,
  onDismiss,
}: PreviewTabTourProps) {
  const [callout, setCallout] = useState({ left: 0, top: 0, ready: false })

  useLayoutEffect(() => {
    if (!active) {
      setCallout((prev) => ({ ...prev, ready: false }))
      return
    }

    const place = () => {
      const tab = tabRefs.current[tabId]
      const wrap = wrapRef.current
      if (!tab || !wrap) return

      const tabBox = tab.getBoundingClientRect()
      const wrapBox = wrap.getBoundingClientRect()
      const left = tabBox.left - wrapBox.left + tabBox.width / 2
      const top = tabBox.bottom - wrapBox.top + 10
      setCallout({ left, top, ready: true })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [active, stepIndex, tabId, tabRefs, wrapRef])

  if (!active) return null

  return (
    <div
      className={`lp-tour-callout${callout.ready ? ' is-ready' : ''}`}
      style={{ left: callout.left, top: callout.top }}
      role="status"
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
