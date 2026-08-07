const TENS: Record<string, number> = {
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
}

const ONES: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  // EN comuns no ditado
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
}

/** Converte números falados (dez, vinte e cinco…) em dígitos para valor + descrição. */
export function normalizeSpokenNumbers(text: string): string {
  let s = text

  s = s.replace(
    /\b(vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|twenty|thirty|forty|fifty)\s+e\s+(um|uma|dois|duas|tr[eê]s|tres|quatro|cinco|seis|sete|oito|nove|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
    (_, tensWord, onesWord) => {
      const tens = TENS[tensWord.toLowerCase()] ?? 0
      const ones = ONES[onesWord.toLowerCase()] ?? 0
      return String(tens + ones)
    },
  )

  const words = Object.keys(ONES).sort((a, b) => b.length - a.length)
  for (const word of words) {
    const num = ONES[word]
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num))
  }

  s = s.replace(/\bcem\b|\bcento\b|\bhundred\b/gi, '100')

  return s.replace(/\s+/g, ' ').trim()
}
