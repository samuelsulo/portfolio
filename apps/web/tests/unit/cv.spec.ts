import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import siteConfig from '../../public/content/data/site-config.json'
import type { SiteConfig } from '@/types/content'
import { resolveCvUrl } from '@/utils/cv'

const cv = { it: '/cv/cv-it.pdf', en: '/cv/cv-en.pdf' }

describe('resolveCvUrl', () => {
  it('returns the CV in the active language', () => {
    expect(resolveCvUrl(cv, 'it')).toBe(cv.it)
    expect(resolveCvUrl(cv, 'en')).toBe(cv.en)
  })

  it('falls back to English for a language without a CV', () => {
    expect(resolveCvUrl(cv, 'fr')).toBe(cv.en)
  })

  it('returns null when no CV is configured', () => {
    expect(resolveCvUrl(null, 'it')).toBeNull()
  })
})

describe('site config CV', () => {
  it('points every language to a PDF that is published with the site', () => {
    const config = siteConfig as SiteConfig
    expect(config.cvUrl).not.toBeNull()
    for (const url of Object.values(config.cvUrl ?? {})) {
      expect(url).toMatch(/^\/cv\/.+\.pdf$/)
      expect(existsSync(resolve(__dirname, '../../public', url.slice(1)))).toBe(true)
    }
  })
})
