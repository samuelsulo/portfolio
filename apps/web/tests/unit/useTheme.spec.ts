import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, readStoredTheme, useTheme } from '../../src/composables/useTheme'

const KEY = 'samuelsulo-portfolio:theme'

function stubMatchMedia(prefersLight: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: prefersLight, addEventListener: vi.fn() }),
  )
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.head.innerHTML = '<meta name="theme-color" content="#05060a">'
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('readStoredTheme', () => {
    it('defaults to system when nothing is stored', () => {
      expect(readStoredTheme()).toBe('system')
    })

    it('returns a stored explicit choice', () => {
      localStorage.setItem(KEY, 'light')
      expect(readStoredTheme()).toBe('light')
    })

    it('ignores an invalid stored value', () => {
      localStorage.setItem(KEY, 'neon')
      expect(readStoredTheme()).toBe('system')
    })

    it('falls back to system when storage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(readStoredTheme()).toBe('system')
      vi.restoreAllMocks()
    })
  })

  describe('applyTheme', () => {
    it('sets data-theme for an explicit choice and the matching theme-color', () => {
      applyTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
        '#e6ebf3',
      )
    })

    it('removes data-theme on system and resolves the color from the OS preference', () => {
      applyTheme('dark')
      stubMatchMedia(true)
      applyTheme('system')
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
      expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
        '#e6ebf3',
      )
    })
  })

  describe('useTheme', () => {
    it('persists an explicit choice and applies it', () => {
      const { mode, setMode } = useTheme()
      setMode('dark')
      expect(mode.value).toBe('dark')
      expect(localStorage.getItem(KEY)).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('stores nothing when going back to system', () => {
      const { setMode } = useTheme()
      setMode('light')
      setMode('system')
      expect(localStorage.getItem(KEY)).toBeNull()
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    })
  })
})
