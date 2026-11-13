import { createI18n } from 'vue-i18n'
import { loadMessages } from '@/content'

export type SupportedLocale = 'it' | 'en'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['it', 'en']
export const DEFAULT_LOCALE: SupportedLocale = 'it'
const LOCALE_STORAGE_KEY = 'samuelsulo-portfolio:locale'

function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value !== null && (SUPPORTED_LOCALES as string[]).includes(value)
}

/**
 * Resolves the initial locale: a previously remembered choice takes
 * priority, then the browser language, falling back to the project default
 * (Italian).
 */
export function resolveInitialLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isSupportedLocale(stored)) {
      return stored
    }
  } catch {
    // localStorage can throw in private-browsing/sandboxed contexts; fall
    // through to the browser/default locale in that case.
  }

  const browserLocale = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : null
  if (isSupportedLocale(browserLocale)) {
    return browserLocale
  }

  return DEFAULT_LOCALE
}

export function persistLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore write failures (e.g. storage disabled); the choice simply
    // won't be remembered across visits.
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  // The messages are fetched at startup, see src/content and main.ts.
  messages: {},
})

/** Switches the language, fetching its translations the first time it is chosen. */
export async function switchLocale(next: SupportedLocale): Promise<void> {
  if (!i18n.global.availableLocales.includes(next)) {
    i18n.global.setLocaleMessage(next, await loadMessages(next))
  }
  i18n.global.locale.value = next
  persistLocale(next)
}
