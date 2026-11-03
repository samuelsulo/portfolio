import type { CaseData, ProjectItem, SiteConfig, StackGroup } from '@/types/content'

/**
 * The content of the site (data files and translations) is not bundled with
 * the application: it is published under `/content/` (see
 * `public/content/`) and fetched once at startup, so it can be updated
 * and deployed without releasing the application (`scripts/deploy-content.sh`).
 */

/**
 * The shape of the content the application understands. Bump it, together with
 * `schemaVersion` in `public/content/data/site-config.json`, when a change to
 * the content files requires a matching application release.
 */
export const CONTENT_SCHEMA_VERSION = 1

const CONTENT_BASE = '/content'

type MessageTree = { [key: string]: MessageTree | string }

export interface Content {
  siteConfig: SiteConfig
  projects: ProjectItem[]
  cases: Record<string, CaseData>
  stack: StackGroup[]
  messages: { it: MessageTree; en: MessageTree }
}

let loaded: Content | null = null

async function fetchJson<T>(path: string): Promise<T> {
  // 'no-cache' makes the browser revalidate instead of trusting a stale copy.
  const response = await fetch(`${CONTENT_BASE}/${path}`, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`Could not load content/${path} (${response.status})`)
  }
  return (await response.json()) as T
}

/** Fetches every content file and keeps the result for `getContent()`. */
export async function loadContent(): Promise<Content> {
  const [siteConfig, projects, cases, stack, it, en] = await Promise.all([
    fetchJson<SiteConfig>('data/site-config.json'),
    fetchJson<ProjectItem[]>('data/projects.json'),
    fetchJson<Record<string, CaseData>>('data/cases.json'),
    fetchJson<StackGroup[]>('data/stack.json'),
    fetchJson<MessageTree>('locales/it.json'),
    fetchJson<MessageTree>('locales/en.json'),
  ])
  if (siteConfig.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported content schema ${siteConfig.schemaVersion}, expected ${CONTENT_SCHEMA_VERSION}`,
    )
  }
  loaded = { siteConfig, projects, cases, stack, messages: { it, en } }
  return loaded
}

/** The loaded content. Only valid once `loadContent()` has resolved, which `main.ts` awaits before mounting. */
export function getContent(): Content {
  if (!loaded) {
    throw new Error('The content has not been loaded yet')
  }
  return loaded
}
