import type {
  CaseData,
  CertificationItem,
  ProjectItem,
  SiteConfig,
  StackGroup,
} from '@/types/content'

/**
 * The content of the site (data files and translations) is not bundled with
 * the application: it is published under `/content/` (see
 * `public/content/`), so it can be updated and deployed without releasing the
 * application (`scripts/deploy-content.sh`).
 *
 * Only what every page needs is fetched at startup (the site configuration, the
 * lists, the stack, the certifications and the translations of the active
 * language). The rest is fetched when it is needed: the other language when it
 * is chosen, the data of a work when it is opened or about to be.
 *
 * Every file is requested with a version taken from `content/manifest.json` (see
 * `assetUrl`), so the browser and CloudFront can keep it for a year, and it is
 * downloaded again only when its content changes.
 */

/**
 * The shape of the content the application understands. Bump it, together with
 * `schemaVersion` in `public/content/data/site-config.json`, when a change to
 * the content files requires a matching application release.
 */
export const CONTENT_SCHEMA_VERSION = 3

const CONTENT_BASE = '/content'

export type ContentLocale = 'it' | 'en'
type MessageTree = { [key: string]: MessageTree | string }

export interface Content {
  siteConfig: SiteConfig
  projects: ProjectItem[]
  stack: StackGroup[]
  certifications: CertificationItem[]
  /** The translations of the language the content was loaded for. */
  messages: MessageTree
}

let loaded: Content | null = null

/** The version (a short hash of the content) of every published file, by its path. Empty when not published. */
let manifest: Record<string, string> = {}

/**
 * Without a manifest (the development server, or a failed request) a file
 * cannot be told apart from a changed one: the URL then carries the current
 * hour, so that whatever is cached under it expires soon.
 */
const FALLBACK_VERSION = String(Math.floor(Date.now() / 3_600_000))

/**
 * The URL of a published file (an image, a PDF, a data file), with the version
 * that makes it safe to cache for a year: when the file changes its version, and
 * so its URL, changes with it.
 */
export function assetUrl(path: string): string {
  return `${path}?v=${manifest[path] ?? FALLBACK_VERSION}`
}

async function loadManifest(): Promise<void> {
  try {
    // The one file that is always revalidated: it tells which version of everything else is current.
    const response = await fetch(`${CONTENT_BASE}/manifest.json`, { cache: 'no-cache' })
    manifest = response.ok ? ((await response.json()) as Record<string, string>) : {}
  } catch {
    // Without it the site still works, with the fallback version.
    manifest = {}
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(assetUrl(`${CONTENT_BASE}/${path}`))
  if (!response.ok) {
    throw new Error(`Could not load content/${path} (${response.status})`)
  }
  return (await response.json()) as T
}

const messages = new Map<ContentLocale, Promise<MessageTree>>()

/** The translations of a language, fetched once. */
export function loadMessages(locale: ContentLocale): Promise<MessageTree> {
  let result = messages.get(locale)
  if (!result) {
    result = fetchJson<MessageTree>(`locales/${locale}.json`)
    // A failed request must not be remembered: the next try can succeed.
    result.catch(() => messages.delete(locale))
    messages.set(locale, result)
  }
  return result
}

const cases = new Map<string, Promise<CaseData>>()

/** The materials of a work, fetched when it is opened (or about to be) and then kept. */
export function loadCase(id: string): Promise<CaseData> {
  let result = cases.get(id)
  if (!result) {
    result = fetchJson<CaseData>(`data/cases/${id}.json`)
    result.catch(() => cases.delete(id))
    cases.set(id, result)
  }
  return result
}

/** Fetches what every page needs, for the language the visitor reads the site in. */
export async function loadContent(locale: ContentLocale): Promise<Content> {
  await loadManifest()
  const [siteConfig, projects, stack, certifications, localeMessages] = await Promise.all([
    fetchJson<SiteConfig>('data/site-config.json'),
    fetchJson<ProjectItem[]>('data/projects.json'),
    fetchJson<StackGroup[]>('data/stack.json'),
    fetchJson<CertificationItem[]>('data/certifications.json'),
    loadMessages(locale),
  ])
  if (siteConfig.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported content schema ${siteConfig.schemaVersion}, expected ${CONTENT_SCHEMA_VERSION}`,
    )
  }
  loaded = { siteConfig, projects, stack, certifications, messages: localeMessages }
  return loaded
}

/** The loaded content. Only valid once `loadContent()` has resolved, which `main.ts` awaits before mounting. */
export function getContent(): Content {
  if (!loaded) {
    throw new Error('The content has not been loaded yet')
  }
  return loaded
}

/**
 * Starts fetching what a visitor is likely to open next, without waiting for it:
 * the data of a work and the first image of its first material, then the code of
 * the work page. Called when a pointer rests on a work, or the player walks up to it.
 */
export function prefetchWork(id: string): void {
  void loadCase(id)
    .then((work) => {
      const first = work.materials[0]
      const source =
        first?.type === 'images'
          ? first.images[0]?.src
          : first?.type === 'devices'
            ? first.desktop.src
            : null
      if (source) new Image().src = assetUrl(source)
    })
    .catch(() => undefined)
  void import('@/views/WorkView.vue')
}
