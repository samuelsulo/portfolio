import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONTENT_SCHEMA_VERSION,
  assetUrl,
  getContent,
  loadCase,
  loadContent,
  loadMessages,
} from '../../src/content'

const contentDir = resolve(__dirname, '../../public/content')

/** Serves the content from `public/content/`, recording every URL that is requested. */
function serveContent(overrides: Record<string, unknown> = {}, manifest?: Record<string, string>) {
  const requested: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      requested.push(url)
      const path = url.split('?')[0].replace('/content/', '')
      if (path === 'manifest.json') {
        return { ok: Boolean(manifest), status: manifest ? 200 : 404, json: async () => manifest }
      }
      const body =
        path in overrides
          ? overrides[path]
          : JSON.parse(readFileSync(resolve(contentDir, path), 'utf8'))
      return { ok: true, status: 200, json: async () => body }
    }),
  )
  return requested
}

afterEach(() => vi.unstubAllGlobals())

describe('content', () => {
  it('declares the schema version the application supports', () => {
    const siteConfig = JSON.parse(
      readFileSync(resolve(contentDir, 'data/site-config.json'), 'utf8'),
    )
    expect(siteConfig.schemaVersion).toBe(CONTENT_SCHEMA_VERSION)
  })

  it('loads at startup only what every page needs, in the language of the visitor', async () => {
    const requested = serveContent()
    const content = await loadContent('it')
    expect(getContent()).toBe(content)
    expect(content.projects.length).toBeGreaterThan(0)
    expect(Object.keys(content.messages).length).toBeGreaterThan(0)
    const paths = requested.map((url) => url.split('?')[0])
    expect(paths).toContain('/content/locales/it.json')
    expect(paths).not.toContain('/content/locales/en.json')
    // The materials of the works are fetched when a work is opened, not before.
    expect(paths.some((path) => path.includes('/data/cases/'))).toBe(false)
  })

  it('fetches the other language only when it is asked for, and only once', async () => {
    const requested = serveContent()
    await loadMessages('en')
    await loadMessages('en')
    expect(requested.filter((url) => url.includes('locales/en.json'))).toHaveLength(1)
  })

  it('fetches the data of a work on demand, once', async () => {
    const requested = serveContent()
    const [first, second] = await Promise.all([loadCase('idea-bar'), loadCase('idea-bar')])
    expect(first).toBe(second)
    expect(first.materials.length).toBeGreaterThan(0)
    expect(requested.filter((url) => url.includes('cases/idea-bar.json'))).toHaveLength(1)
  })

  it('versions every file with the hash of the manifest, so it can be cached for a year', async () => {
    const requested = serveContent(
      {},
      {
        '/content/data/stack.json': 'abc123',
        '/images/cv/samuelsulo-cv-en-1.jpg': 'def456',
      },
    )
    await loadContent('it')
    expect(requested).toContain('/content/data/stack.json?v=abc123')
    expect(assetUrl('/images/cv/samuelsulo-cv-en-1.jpg')).toBe(
      '/images/cv/samuelsulo-cv-en-1.jpg?v=def456',
    )
  })

  it('falls back to a version that expires within the hour when there is no manifest', async () => {
    serveContent()
    await loadContent('it')
    const url = assetUrl('/images/x.webp')
    expect(url).toMatch(/^\/images\/x\.webp\?v=\d+$/)
    expect(Number(url.split('=')[1])).toBe(Math.floor(Date.now() / 3_600_000))
  })

  it('rejects content of an unsupported schema version', async () => {
    const siteConfig = JSON.parse(
      readFileSync(resolve(contentDir, 'data/site-config.json'), 'utf8'),
    )
    serveContent({
      'data/site-config.json': { ...siteConfig, schemaVersion: CONTENT_SCHEMA_VERSION + 1 },
    })
    await expect(loadContent('it')).rejects.toThrow(/Unsupported content schema/)
  })

  it('fails when a file cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    )
    await expect(loadContent('it')).rejects.toThrow(/Could not load/)
  })
})
