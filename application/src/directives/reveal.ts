import type { Directive } from 'vue'

/**
 * `v-reveal`: a subtle, one-shot fade/slide-in used on section containers as
 * they enter the viewport. Skipped entirely when the user prefers reduced
 * motion, per the project's accessibility rules.
 */

const prefersReducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

const observer =
  typeof window !== 'undefined'
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer?.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.15 },
      )
    : null

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal')

    if (prefersReducedMotionQuery?.matches) {
      el.classList.add('is-visible')
      return
    }

    observer?.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
