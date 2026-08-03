// Regera os ícones do Android a partir dos SVGs desta pasta.
// Requer `sharp`, que não é dependência do projeto: npx --yes --package=sharp node brand/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const svgFull = readFileSync(join(here, 'flux-icon.svg'))
const svgFg = readFileSync(join(here, 'flux-icon-foreground.svg'))
const resDir = join(here, '..', 'android/app/src/main/res')

// `size` = ícone legado (Android < 8). `fg` = foreground adaptativo (Android 8+),
// maior porque o sistema recorta a máscara sobre uma zona segura menor.
const densities = [
  { dir: 'mipmap-mdpi', size: 48, fg: 108 },
  { dir: 'mipmap-hdpi', size: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fg: 432 },
]

for (const { dir, size, fg } of densities) {
  const out = join(resDir, dir)
  if (!existsSync(out)) mkdirSync(out, { recursive: true })

  await sharp(svgFull).resize(size, size).png().toFile(join(out, 'ic_launcher.png'))
  await sharp(svgFull).resize(size, size).png().toFile(join(out, 'ic_launcher_round.png'))
  await sharp(svgFg).resize(fg, fg).png().toFile(join(out, 'ic_launcher_foreground.png'))

  console.log(`✓ ${dir} (legacy ${size}px, foreground ${fg}px)`)
}

await sharp(svgFull).resize(512, 512).png().toFile(join(here, 'flux-icon-512.png'))
console.log('✓ Play Store → brand/flux-icon-512.png')
