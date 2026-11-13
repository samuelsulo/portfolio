import { ref, type Ref } from 'vue'

export type ThemeMode = 'light' | 'system' | 'dark'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'system', 'dark']

const THEME_STORAGE_KEY = 'samuelsulo-portfolio:theme'

/** Browser UI colors (mobile address bar), kept in sync with --color-bg per theme. */
const THEME_COLORS = { dark: '#05060a', light: '#e6ebf3' } as const

const mode: Ref<ThemeMode> = ref('system')

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'system' || value === 'dark'
}

/** The stored choice, or "system" when nothing valid is stored or storage is unavailable. */
export function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(stored) ? stored : 'system'
  } catch {
    // localStorage can throw in private-browsing/sandboxed contexts.
    return 'system'
  }
}

function persistTheme(next: ThemeMode): void {
  try {
    if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Not persisting is fine: the choice still applies for this visit.
  }
}

function prefersLight(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  )
}

/** Applies a mode to the document: an explicit data-theme, or none to follow the OS. */
export function applyTheme(next: ThemeMode): void {
  const root = document.documentElement
  if (next === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', next)

  const resolved = next === 'system' ? (prefersLight() ? 'light' : 'dark') : next
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved])
}

/** Call once at startup: restores the stored choice and follows OS changes while on "system". */
export function initTheme(): void {
  mode.value = readStoredTheme()
  applyTheme(mode.value)
  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (mode.value === 'system') applyTheme('system')
    })
  }
}

export function useTheme() {
  function setMode(next: ThemeMode): void {
    mode.value = next
    persistTheme(next)
    applyTheme(next)
  }

  return { mode, setMode }
}
