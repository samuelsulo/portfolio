/**
 * useHideOnScroll
 *
 * Scroll-direction tracking for a mobile app bar / bottom nav that should
 * hide on scroll-down and reveal on scroll-up, like most modern mobile
 * sites/apps — see references/navigation.md for the full rationale and the
 * CSS pattern (`transform`/`opacity` only, never height/display) that
 * consumes `isVisible`.
 *
 * Only active below `maxWidth` — desktop layouts normally have room for a
 * static header, so `isVisible` stays permanently true above that width.
 */
import { onMounted, onUnmounted, ref } from 'vue'

export interface UseHideOnScrollOptions {
  /** Px scrolled from the top within which the bar always stays visible, to avoid jitter near the top. */
  revealOffset?: number
  /** Minimum scroll delta (px) required to register a direction change, to ignore sub-pixel/bounce noise. */
  threshold?: number
  /** Viewport width (px) at and below which the hide/show behavior is active. */
  maxWidth?: number
}

export function useHideOnScroll(options: UseHideOnScrollOptions = {}) {
  const { revealOffset = 64, threshold = 8, maxWidth = 768 } = options
  const isVisible = ref(true)

  let lastScrollY = 0
  let ticking = false

  function isMobileViewport() {
    return window.innerWidth <= maxWidth
  }

  function update() {
    ticking = false

    if (!isMobileViewport()) {
      isVisible.value = true
      lastScrollY = window.scrollY
      return
    }

    const currentScrollY = window.scrollY
    const delta = currentScrollY - lastScrollY

    if (currentScrollY <= revealOffset) {
      isVisible.value = true
    } else if (Math.abs(delta) >= threshold) {
      isVisible.value = delta < 0 // scrolling up -> reveal, scrolling down -> hide
    }

    lastScrollY = currentScrollY
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  onMounted(() => {
    lastScrollY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))

  return { isVisible }
}
