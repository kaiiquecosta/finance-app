import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

type ThumbState = { width: number; left: number }

function useDragScroll(targetRef: RefObject<HTMLElement | null>, watchKey?: string | number | boolean) {
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    let active = false
    let dragging = false
    let startX = 0
    let startScroll = 0
    let pointerId: number | null = null

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      active = true
      dragging = false
      startX = event.clientX
      startScroll = el.scrollLeft
      pointerId = event.pointerId
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId) return
      const delta = event.clientX - startX
      if (!dragging && Math.abs(delta) < 8) return
      if (!dragging) {
        dragging = true
        el.setPointerCapture(event.pointerId)
      }
      event.preventDefault()
      el.scrollLeft = startScroll - delta
    }

    const endDrag = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId) return
      active = false
      if (dragging) {
        el.dataset.dragged = 'true'
        window.setTimeout(() => {
          delete el.dataset.dragged
        }, 0)
        el.releasePointerCapture(event.pointerId)
      }
      dragging = false
      pointerId = null
    }

    const onClick = (event: MouseEvent) => {
      if (el.dataset.dragged === 'true') {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', endDrag)
    el.addEventListener('pointercancel', endDrag)
    el.addEventListener('click', onClick, true)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', endDrag)
      el.removeEventListener('pointercancel', endDrag)
      el.removeEventListener('click', onClick, true)
    }
  }, [targetRef, watchKey])
}

export function HorizontalScrollBar({
  targetRef,
  label,
  variant = 'tabs',
  watchKey,
}: {
  targetRef: RefObject<HTMLElement | null>
  label?: string
  variant?: 'tabs' | 'inner'
  watchKey?: string | number | boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, startThumbLeft: 0 })
  const [thumb, setThumb] = useState<ThumbState>({ width: 100, left: 0 })
  const [canScroll, setCanScroll] = useState(false)

  const updateThumb = useCallback(() => {
    const target = targetRef.current
    const track = trackRef.current
    if (!target || !track) return

    const overflow = target.scrollWidth - target.clientWidth
    const scrollable = overflow > 2
    setCanScroll(scrollable)

    const trackWidth = track.clientWidth
    if (!scrollable || trackWidth <= 0) {
      setThumb({ width: trackWidth || 100, left: 0 })
      return
    }

    const thumbWidth = Math.max((target.clientWidth / target.scrollWidth) * trackWidth, 32)
    const maxThumbLeft = trackWidth - thumbWidth
    const left = maxThumbLeft <= 0 ? 0 : (target.scrollLeft / overflow) * maxThumbLeft
    setThumb({ width: thumbWidth, left })
  }, [targetRef])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    updateThumb()
    target.addEventListener('scroll', updateThumb, { passive: true })

    const resizeObserver = new ResizeObserver(updateThumb)
    resizeObserver.observe(target)
    if (trackRef.current) resizeObserver.observe(trackRef.current)

    return () => {
      target.removeEventListener('scroll', updateThumb)
      resizeObserver.disconnect()
    }
  }, [targetRef, updateThumb, watchKey])

  const scrollToThumbLeft = (nextLeft: number) => {
    const target = targetRef.current
    const track = trackRef.current
    if (!target || !track) return

    const overflow = target.scrollWidth - target.clientWidth
    const maxThumbLeft = track.clientWidth - thumb.width
    if (overflow <= 0 || maxThumbLeft <= 0) return

    const ratio = nextLeft / maxThumbLeft
    target.scrollLeft = ratio * overflow
  }

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canScroll || event.target !== trackRef.current) return
    const track = trackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    scrollToThumbLeft(Math.max(0, Math.min(clickX - thumb.width / 2, track.clientWidth - thumb.width)))
  }

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canScroll) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: targetRef.current?.scrollLeft ?? 0,
      startThumbLeft: thumb.left,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const track = trackRef.current
    if (!track) return

    const delta = event.clientX - dragRef.current.startX
    scrollToThumbLeft(dragRef.current.startThumbLeft + delta)
  }

  const onThumbPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className={`lp-hscroll-bar lp-hscroll-bar--${variant}`}>
      <div
        ref={trackRef}
        className="lp-hscroll-bar__track"
        onPointerDown={onTrackPointerDown}
        role="scrollbar"
        aria-orientation="horizontal"
        aria-hidden={!label}
      >
        <div
          className={`lp-hscroll-bar__thumb${canScroll ? '' : ' is-full'}`}
          style={{ width: `${thumb.width}px`, transform: `translateX(${thumb.left}px)` }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
        />
      </div>
      {label ? <small>{label}</small> : null}
    </div>
  )
}

export function useHorizontalDragScroll(
  targetRef: RefObject<HTMLElement | null>,
  watchKey?: string | number | boolean,
) {
  useDragScroll(targetRef, watchKey)
}
