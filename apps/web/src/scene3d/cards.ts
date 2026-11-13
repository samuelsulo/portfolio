/**
 * Draws the "card" shown on the wall for the things that have no picture of
 * their own (a stack group, the contact details), in the look of the site:
 * a dark panel with a neon border, mono eyebrow, bold title and its lines or icons.
 */

export interface CardIcon {
  label: string
  /** Address of the logo in the sprite (`<sprite url>#<name>`), when the item has one. */
  src: string | null
  /** Keeps the original colors of the SVG instead of tinting it. */
  colored: boolean
}

export interface CardSpec {
  eyebrow: string
  title: string
  lines: string[]
  icons: CardIcon[]
}

export interface CardColors {
  background: string
  border: string
  text: string
  muted: string
  primary: string
  accent: string
}

export const CARD_WIDTH = 960
export const CARD_HEIGHT = 720
/** The layout is drawn in 960x720 units, on a canvas that is smaller: it is shown at about a third of that on screen. */
export const CARD_SCALE = 0.8

const SANS = '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif'
const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace'

/** A logo as the markup of a standalone SVG, from the `<symbol>` of the sprite. */
const sprites = new Map<string, Promise<Map<string, string>>>()

function loadSprite(url: string): Promise<Map<string, string>> {
  let sprite = sprites.get(url)
  if (!sprite) {
    sprite = fetch(url)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(url))))
      .then((text) => {
        const logos = new Map<string, string>()
        const document = new DOMParser().parseFromString(text, 'image/svg+xml')
        const serializer = new XMLSerializer()
        for (const symbol of document.querySelectorAll('symbol')) {
          // The attributes of the symbol (viewBox, fill, stroke) become those of the image. It is given a
          // size, since an SVG without one is refused by some browsers when drawn on a canvas.
          const attributes = [...symbol.attributes]
            .filter((attribute) => attribute.name !== 'id')
            .map((attribute) => `${attribute.name}="${attribute.value}"`)
          const inner = [...symbol.childNodes].map((node) => serializer.serializeToString(node))
          logos.set(
            symbol.id,
            `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ${attributes.join(' ')}>${inner.join('')}</svg>`,
          )
        }
        return logos
      })
      // A failed request must not be remembered: the next card can try again.
      .catch(() => {
        sprites.delete(url)
        return new Map<string, string>()
      })
    sprites.set(url, sprite)
  }
  return sprite
}

const icons = new Map<string, Promise<HTMLImageElement | null>>()

/** The logo at an address like `/images/stack/sprite.svg?v=abc#aws`: the sprite is fetched once for all of them. */
function loadIcon(src: string): Promise<HTMLImageElement | null> {
  let icon = icons.get(src)
  if (!icon) {
    const [url, id] = src.split('#')
    icon = loadSprite(url).then(
      (logos) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const svg = logos.get(id)
          if (!svg) return resolve(null)
          const image = new Image()
          const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
          // Once decoded the image no longer needs the temporary address.
          image.onload = () => {
            URL.revokeObjectURL(url)
            resolve(image)
          }
          image.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(null)
          }
          image.src = url
        }),
    )
    icons.set(src, icon)
  }
  return icon
}

/** The icon as a canvas filled with one color, since the logos are plain black shapes. */
function tinted(image: HTMLImageElement, color: string, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0, size, size)
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = color
  context.fillRect(0, 0, size, size)
  return canvas
}

/** The largest size, up to `max`, at which the text fits in `width`. */
function fit(
  context: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  max: number,
  width: number,
): number {
  let size = max
  context.font = `${weight} ${size}px ${family}`
  while (size > 14 && context.measureText(text).width > width) {
    size -= 2
    context.font = `${weight} ${size}px ${family}`
  }
  return size
}

async function fontsReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`700 40px ${SANS}`),
      document.fonts.load(`500 24px ${MONO}`),
    ])
  } catch {
    // Drawing with the fallback font is better than not drawing.
  }
}

export async function drawCard(
  canvas: HTMLCanvasElement,
  spec: CardSpec,
  colors: CardColors,
): Promise<void> {
  await fontsReady()
  const loaded = await Promise.all(spec.icons.map((icon) => (icon.src ? loadIcon(icon.src) : null)))

  canvas.width = CARD_WIDTH * CARD_SCALE
  canvas.height = CARD_HEIGHT * CARD_SCALE
  const context = canvas.getContext('2d')!
  context.scale(CARD_SCALE, CARD_SCALE)
  const margin = 60
  const inner = CARD_WIDTH - margin * 2

  context.fillStyle = colors.background
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.strokeStyle = colors.primary
  context.lineWidth = 6
  context.strokeRect(12, 12, CARD_WIDTH - 24, CARD_HEIGHT - 24)
  context.fillStyle = colors.accent
  context.fillRect(margin, 150, 120, 6)

  context.textBaseline = 'alphabetic'
  context.fillStyle = colors.primary
  context.font = `500 34px ${MONO}`
  context.fillText(spec.eyebrow.toUpperCase().split('').join(' '), margin, 100)

  const titleSize = fit(context, spec.title, SANS, 700, 88, inner)
  context.fillStyle = colors.text
  context.fillText(spec.title, margin, 150 + 36 + titleSize * 0.8)

  let y = 150 + 36 + titleSize + 60

  if (spec.lines.length) {
    for (const line of spec.lines) {
      const size = fit(context, line, MONO, 500, 46, inner - 40)
      context.fillStyle = colors.accent
      context.fillRect(margin, y - size * 0.55, 14, 14)
      context.fillStyle = colors.muted
      context.fillText(line, margin + 40, y)
      y += 96
    }
  }

  if (spec.icons.length) {
    const columns = 5
    const cell = inner / columns
    spec.icons.forEach((icon, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const centerX = margin + cell * column + cell / 2
      const top = y - 30 + row * 200
      const image = loaded[index]
      if (image) {
        const size = 100
        const source = icon.colored ? image : tinted(image, colors.text, 128)
        context.drawImage(source, centerX - size / 2, top, size, size)
      }
      fit(context, icon.label, MONO, 500, 28, cell - 12)
      context.fillStyle = colors.muted
      context.textAlign = 'center'
      context.fillText(icon.label, centerX, image ? top + 100 + 38 : top + 50)
      context.textAlign = 'left'
    })
  }
}
