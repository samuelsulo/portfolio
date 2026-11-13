import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Becomes true, and stays true, once the element is within `margin` of the
 * viewport: used to fetch what a section needs (its images) shortly before the
 * visitor scrolls to it, and not at all if they never do.
 */
export function useNearViewport(target: Ref<HTMLElement | null>, margin = '600px'): Ref<boolean> {
  const isNear = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value || typeof IntersectionObserver === 'undefined') {
      // Nothing to observe with: better to load than to leave the section empty.
      isNear.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          isNear.value = true
          observer?.disconnect()
        }
      },
      { rootMargin: margin },
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return isNear
}
