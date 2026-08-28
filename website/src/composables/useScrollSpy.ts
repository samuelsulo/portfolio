import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Observes a list of section ids and reports which one is currently most
 * visible in the viewport, to drive the "active" state of the navbar links.
 */
export function useScrollSpy(sectionIds: string[]): { activeId: Ref<string | null> } {
  const activeId = ref<string | null>(sectionIds[0] ?? null)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) {
      return
    }

    const visibleRatios = new Map<string, number>()

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of visibleRatios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestId) {
          activeId.value = bestId
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-15% 0px -35% 0px' },
    )

    for (const el of elements) {
      observer.observe(el)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { activeId }
}
