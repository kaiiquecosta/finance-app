import { useEffect, useRef, type RefObject } from 'react'
import { enterLandingDemoSounds, ensureLandingAudioReady, leaveLandingDemoSounds } from './landingSounds'
import { useScrollVisible } from './useScrollVisible'

/** Demo da landing: visibilidade estrita + sessão de áudio ligada só enquanto inView. */
export function useLandingDemoSession(
  ref: RefObject<Element | null>,
  minRatio = 0.42,
  rootMargin = '-10% 0px -15% 0px',
) {
  const inView = useScrollVisible(ref, minRatio, rootMargin)
  const inViewRef = useRef(inView)
  inViewRef.current = inView

  useEffect(() => {
    if (!inView) {
      leaveLandingDemoSounds()
      return
    }

    enterLandingDemoSounds()
    void ensureLandingAudioReady()
    return () => leaveLandingDemoSounds()
  }, [inView])

  return { inView, inViewRef }
}
