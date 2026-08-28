import { watch, type Ref } from 'vue'

/**
 * Locks page scrolling while `isLocked` is true (used for the mobile nav
 * overlay), restoring the previous overflow value on unlock/unmount.
 */
export function useBodyScrollLock(isLocked: Ref<boolean>) {
  watch(
    isLocked,
    (locked) => {
      if (typeof document === 'undefined') return
      document.body.style.overflow = locked ? 'hidden' : ''
    },
    { immediate: true },
  )
}
