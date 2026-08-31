import { useLayoutEffect, useState, type MutableRefObject, type RefObject } from 'react'
import type { PreviewId } from './previewTourSteps'

type PreviewTabTourProps = {
  active: boolean
  stepIndex: number
  totalSteps: number
  tabId: PreviewId | null
  exploreMode?: boolean
  title: string
  message: string
  tabRefs: MutableRefObject<Partial<Record<PreviewId, HTMLButtonElement>>>
  anchorRef: RefObject<HTMLElement | null>
  tabsWrapRef: RefObject<HTMLElement | null>
  onNext: () => void
  onDismiss: () => void
}

type TourLayout = {
  ring: { left: number; top: number; width: number; height: number } | null
  callout: { left: number; top: number }
  ready: boolean
}

export function PreviewTabTour({
  active,
  stepIndex,
  totalSteps,
  tabId,
  exploreMode = false,
  title,
  message,
  tabRefs,
  anchorRef,
  tabsWrapRef,
  onNext,
  onDismiss,
}: PreviewTabTourProps) {
  const [layout, setLayout] = useState<TourLayout>({
    ring: null,
    callout: { left: 0, top: 0 },
    ready: false,
  })

  useLayoutEffect(() => {
    if (!active) {
      setLayout({ ring: null, callout: { left: 0, top: 0 }, ready: false })
      return
    }

    let raf = 0
    let attempts = 0

    const place = () => {
      const anchor = anchorRef.current
      if (!anchor) {
        if (attempts < 12) {
          attempts += 1
          raf = window.requestAnimationFrame(place)
        }
        return
      }

      const anchorBox = anchor.getBoundingClientRect()
      const calloutWidth = Math.min(320, anchorBox.width - 24)

      if (exploreMode) {
        const tabsWrap = tabsWrapRef.current
        const tabsBottom = tabsWrap
          ? tabsWrap.getBoundingClientRect().bottom - anchorBox.top
          : 118
        setLayout({
          ring: null,
          callout: {
            left: anchorBox.width / 2,
            top: tabsBottom + 20,
          },
          ready: true,
        })
        return
      }

      if (!tabId) return

      const tab = tabRefs.current[tabId]
      if (!tab) {
        if (attempts < 12) {
          attempts += 1
          raf = window.requestAnimationFrame(place)
        }
        return
      }

      const tabBox = tab.getBoundingClientRect()
      const padX = 7
      const padY = 6
      const rawLeft = tabBox.left - anchorBox.left + tabBox.width / 2
      const minLeft = calloutWidth / 2 + 12
      const maxLeft = anchorBox.width - calloutWidth / 2 - 12
      const left = Math.max(minLeft, Math.min(maxLeft, rawLeft))
      const top = tabBox.bottom - anchorBox.top + 16

      setLayout({
        ring: {
          left: tabBox.left - anchorBox.left - padX,
          top: tabBox.top - anchorBox.top - padY,
          width: tabBox.width + padX * 2,
          height: tabBox.height + padY * 2,
        },
        callout: { left, top },
        ready: true,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [active, stepIndex, tabId, exploreMode, tabRefs, anchorRef, tabsWrapRef])

  if (!active) return null

  const isLast = stepIndex >= totalSteps - 1

  return (
    <>
      {layout.ring ? (
        <div
          className={`lp-tour-tab-ring${layout.ready ? ' is-ready' : ''}`}
          style={{
            left: layout.ring.left,
            top: layout.ring.top,
            width: layout.ring.width,
            height: layout.ring.height,
          }}
          aria-hidden
        />
      ) : null}

      <div
        className={`lp-tour-callout${layout.ready ? ' is-ready' : ''}${exploreMode ? ' is-explore' : ''}`}
        style={{
          left: layout.callout.left,
          top: layout.callout.top,
          width: 'min(320px, calc(100% - 24px))',
        }}
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
            {isLast ? 'Começar a explorar' : 'Continuar'}
          </button>
          {!isLast ? (
            <button type="button" className="lp-tour-callout__skip" onClick={onDismiss}>
              Pular tour
            </button>
          ) : null}
        </div>
      </div>
    </>
  )
}
