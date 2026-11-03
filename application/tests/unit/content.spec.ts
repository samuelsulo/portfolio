import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_SCHEMA_VERSION, getContent, loadContent } from '../../src/content'

const contentDir = resolve(__dirname, '../../public/content')

function serveContent(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const path = url.replace('/content/', '')
      const body =
        path in overrides
          ? overrides[path]
          : JSON.parse(readFileSync(resolve(contentDir, path), 'utf8'))
      return { ok: true, status: 200, json: async () => body }
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('content', () => {
  it('declares the schema version the application supports', () => {
    const siteConfig = JSON.parse(
      readFileSync(resolve(contentDir, 'data/site-config.json'), 'utf8'),
    )
    expect(siteConfig.schemaVersion).toBe(CONTENT_SCHEMA_VERSION)
  })

  it('loads every content file', async () => {
    serveContent()
    const content = await loadContent()
    expect(getContent()).toBe(content)
    expect(content.projects.length).toBeGreaterThan(0)
    expect(Object.keys(content.messages.it)).toEqual(Object.keys(content.messages.en))
  })

  it('rejects content of an unsupported schema version', async () => {
    const siteConfig = JSON.parse(
      readFileSync(resolve(contentDir, 'data/site-config.json'), 'utf8'),
    )
    serveContent({
      'data/site-config.json': { ...siteConfig, schemaVersion: CONTENT_SCHEMA_VERSION + 1 },
    })
    await expect(loadContent()).rejects.toThrow(/Unsupported content schema/)
  })

  it('fails when a file cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    )
    await expect(loadContent()).rejects.toThrow(/Could not load/)
  })
})
