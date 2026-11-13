import { assetUrl } from '@/content'

/** The sprite with the logo of every tool of the stack (see `scripts/stack-sprite.mjs`). */
const SPRITE = '/images/stack/sprite.svg'

/** The address of one logo in the sprite, to use as `<use href>`; the sprite is one file, fetched once. */
export function stackIconHref(icon: string): string {
  return `${assetUrl(SPRITE)}#${icon}`
}
