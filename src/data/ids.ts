/** Id numérico único (compatível com o bigint gerado no cliente do legado). */
export function newId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}
