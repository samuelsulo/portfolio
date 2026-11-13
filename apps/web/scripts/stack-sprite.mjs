// Builds the sprite of the stack logos: one SVG with a <symbol> per logo, so that the site
// downloads all of them in a single request instead of about thirty (see StackSection.vue and
// src/scene3d/cards.ts). The sources are the files of `stack-icons/`, the sprite is written to
// `public/images/stack/sprite.svg` and committed, like the CV previews.
//
//   npm run stack-sprite        (from apps/web/)
//
// Add a logo: put its SVG in `stack-icons/` (the file name is the `icon` of `stack.json`) and
// run the command. A unit test fails when the sprite is out of date.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SOURCE_DIR = join(root, 'stack-icons')
export const SPRITE_FILE = join(root, 'public', 'images', 'stack', 'sprite.svg')

// What of the root <svg> of a logo is kept on its <symbol>: how it is drawn, not its size or role.
const KEPT_ATTRIBUTES = new Set([
  'viewBox',
  'fill',
  'fill-rule',
  'clip-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
])

function toSymbol(name, svg) {
  const match = /^\s*<svg([\s\S]*?)>([\s\S]*)<\/svg>\s*$/.exec(svg)
  if (!match) throw new Error(`${name}.svg is not an SVG`)
  const attributes = [...match[1].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)]
    .filter(([, key]) => KEPT_ATTRIBUTES.has(key))
    .map(([, key, value]) => `${key}="${value}"`)
  if (!attributes.some((attribute) => attribute.startsWith('viewBox='))) {
    throw new Error(`${name}.svg has no viewBox`)
  }
  const inner = match[2]
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/\s*\n\s*/g, '')
    .trim()
  return `<symbol id="${name}" ${attributes.join(' ')}>${inner}</symbol>`
}

/** The sprite built from the logos of a folder, in alphabetical order so that it is reproducible. */
export function buildSprite(directory = SOURCE_DIR) {
  const symbols = readdirSync(directory)
    .filter((file) => file.endsWith('.svg'))
    .sort()
    .map((file) => toSymbol(file.slice(0, -4), readFileSync(join(directory, file), 'utf8')))
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sprite = buildSprite()
  writeFileSync(SPRITE_FILE, sprite)
  console.log(`Wrote ${SPRITE_FILE} (${(sprite.length / 1024).toFixed(1)} kB)`)
}
