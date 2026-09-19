import { watch, onUnmounted, type Ref } from 'vue'

/**
 * Calls `onOutside` when a pointer press lands outside `target` while
 * `active` is true (used to close the mobile nav menu when tapping
 * elsewhere on the page). Listens for `pointerdown` rather than `click` so
 * touch and mouse are both covered, and only while `active` to avoid an
 * idle document-wide listener.
 */
export function useClickOutside(
  target: Ref<HTMLElement | null | undefined>,
  active: Ref<boolean>,
  onOutside: () => void,
) {
  function handlePointerDown(event: PointerEvent) {
    const el = target.value
    if (!el || el.contains(event.target as Node)) return
    onOutside()
  }

  watch(
    active,
    (isActive) => {
      document.removeEventListener('pointerdown', handlePointerDown)
      if (isActive) {
        document.addEventListener('pointerdown', handlePointerDown)
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    document.removeEventListener('pointerdown', handlePointerDown)
  })
}
