/** Quebra texto em caracteres para reveal cinematográfico (GSAP). */
export function SplitChars({ text, className = '' }: { text: string; className?: string }) {
  return (
    <>
      {Array.from(text).map((char, index) => (
        <span key={`${char}-${index}`} className="split-char-wrap" aria-hidden={char === ' ' ? undefined : false}>
          <span data-split-char className={className}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </>
  )
}
