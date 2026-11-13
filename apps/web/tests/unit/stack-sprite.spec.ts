import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import stack from '../../public/content/data/stack.json'
import certifications from '../../public/content/data/certifications.json'
// @ts-expect-error the script is plain JavaScript, run by `npm run stack-sprite`
import { SPRITE_FILE, buildSprite } from '../../scripts/stack-sprite.mjs'

const publicDir = resolve(__dirname, '../../public')

describe('stack logos', () => {
  const sprite = readFileSync(SPRITE_FILE, 'utf8')

  it('are in a sprite that is up to date with their sources (run `npm run stack-sprite`)', () => {
    expect(sprite).toBe(buildSprite())
  })

  it('have a symbol for every icon the stack points to', () => {
    const icons = new Set(
      stack.flatMap((group) => group.items.flatMap((item) => ('icon' in item ? [item.icon] : []))),
    )
    expect(icons.size).toBeGreaterThan(0)
    for (const icon of icons) expect(sprite, String(icon)).toContain(`<symbol id="${icon}" `)
  })

  it('exist for every skill of the stack, a generic icon where the tool has no logo', () => {
    const withoutIcon = stack.flatMap((group) =>
      group.items.filter((item) => !('icon' in item)).map((item) => item.label),
    )
    expect(withoutIcon).toEqual([])
  })

  it('are published as the sprite alone, not as thirty files', () => {
    expect(readdirSync(resolve(publicDir, 'images/stack'))).toEqual(['sprite.svg'])
  })
})

describe('certification badges', () => {
  it('exist and are small, since they are shown at 80px', () => {
    for (const certification of certifications) {
      const file = resolve(publicDir, certification.image.slice(1))
      expect(existsSync(file), certification.image).toBe(true)
      expect(readFileSync(file).length, certification.image).toBeLessThan(20 * 1024)
    }
  })
})
