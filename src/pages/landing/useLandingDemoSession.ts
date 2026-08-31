import { useEffect, useRef, type RefObject } from 'react'
import { enterLandingDemoSounds, ensureLandingAudioReady, leaveLandingDemoSounds } from './landingSounds'
import { useDemoSectionFocused, type DemoSectionFocusOptions } from './useScrollVisible'

/** Demo da landing: foco real na seção + sessão de áudio só enquanto inView. */
export function useLandingDemoSession(
  ref: RefObject<Element | null>,
  focus: DemoSectionFocusOptions = {},
) {
  const inView = useDemoSectionFocused(ref, focus)
  const inViewRef = useRef(inView)
  inViewRef.current = inView

  useEffect(() => {
    if (!inView) return

    enterLandingDemoSounds()
    void ensureLandingAudioReady()
    return () => leaveLandingDemoSounds()
  }, [inView])

  return { inView, inViewRef }
}
