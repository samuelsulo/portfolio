import type { SiteConfig } from '@/types/content'

/**
 * The CV to offer for the active language: the one in that language,
 * the English one when there is none, or null when no CV is configured.
 */
export function resolveCvUrl(cv: SiteConfig['cvUrl'], locale: string): string | null {
  if (!cv) {
    return null
  }
  return (cv as Record<string, string>)[locale] ?? cv.en
}

/** The pages of each CV PDF (see `cv/README.md`): the 3D view shows each one as an image in `public/images/cv/`. */
export const CV_PAGES = 2
