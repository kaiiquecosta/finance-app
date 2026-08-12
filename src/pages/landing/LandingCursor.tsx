/** Cursor customizado — apenas desktop, desativado com reduced-motion. */
export function LandingCursor() {
  return (
    <div className="landing-cursor-root" aria-hidden>
      <div className="landing-cursor-dot" />
      <div className="landing-cursor-ring" />
    </div>
  )
}
