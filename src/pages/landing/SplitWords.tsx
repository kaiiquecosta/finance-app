/** Quebra texto em palavras para reveal com máscara (GSAP). */
export function SplitWords({ text }: { text: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return (
    <>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="split-word-wrap" aria-hidden={false}>
          <span data-split-word>{word}</span>
          {index < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </>
  )
}
