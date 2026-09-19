<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ProjectCard from '@/components/ui/ProjectCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import projectsData from '@/data/projects.json'
import type { ProjectItem } from '@/types/content'

const { t } = useI18n()
const projects = projectsData as ProjectItem[]

const items = computed(() =>
  projects.map((project) => ({
    ...project,
    title: t(`${project.translationKey}.title`),
    description: t(`${project.translationKey}.description`),
    imageAlt: t(project.imageAlt),
  })),
)

const track = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(true)

function updateScrollState() {
  const el = track.value
  if (!el) return
  canScrollPrev.value = el.scrollLeft > 4
  canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollByCard(direction: 1 | -1) {
  const el = track.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('.project-card')
  const amount = (card?.offsetWidth ?? 320) + 24
  el.scrollBy({ left: amount * direction, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  track.value?.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('resize', updateScrollState)
})

onUnmounted(() => {
  track.value?.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('resize', updateScrollState)
})
</script>

<template>
  <section id="projects" v-reveal class="projects">
    <div class="container projects__header">
      <SectionHeading
        :eyebrow="t('projects.eyebrow')"
        :title="t('projects.title')"
        :subtitle="t('projects.subtitle')"
      />

      <div class="projects__arrows">
        <button
          type="button"
          class="projects__arrow"
          :disabled="!canScrollPrev"
          :aria-label="t('projects.prevAriaLabel')"
          @click="scrollByCard(-1)"
        >
          <AppIcon name="arrow-left" :size="20" />
        </button>
        <button
          type="button"
          class="projects__arrow"
          :disabled="!canScrollNext"
          :aria-label="t('projects.nextAriaLabel')"
          @click="scrollByCard(1)"
        >
          <AppIcon name="arrow-right" :size="20" />
        </button>
      </div>
    </div>

    <div class="projects__viewport container">
      <ul ref="track" class="projects__track" role="list">
        <li v-for="item in items" :key="item.id" class="projects__item">
          <ProjectCard
            :image="item.image"
            :image-alt="item.imageAlt"
            :title="item.title"
            :description="item.description"
            :technologies="item.technologies"
            :url="item.url"
          />
        </li>
      </ul>
    </div>

    <p class="projects__scroll-hint container">{{ t('projects.scrollHint') }}</p>
  </section>
</template>

<style scoped>
.projects {
  /* Extra room reserved above the card track so the hover lift + glow
     (see .projects__track) never get clipped by the scroll container. */
  --project-card-hover-space: 28px;

  padding-block: var(--space-2xl);
}

.projects__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.projects__arrows {
  display: none;
  gap: var(--space-2xs);
}

@media (min-width: 900px) {
  .projects__arrows {
    display: flex;
  }
}

.projects__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.projects__arrow:hover:not(:disabled) {
  border-color: var(--color-neon-primary);
  color: var(--color-neon-primary);
  box-shadow: var(--glow-primary);
}

.projects__arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.projects__viewport {
  /* .projects__track below adds matching top padding (to give the card
     hover lift + glow room so they aren't clipped by the scroll
     container); the negative margin here cancels it out so the visual
     gap after the heading stays the same. */
  margin-top: calc(var(--space-lg) - var(--project-card-hover-space));
}

.projects__track {
  display: flex;
  gap: var(--space-md);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-top: var(--project-card-hover-space);
  padding-bottom: var(--space-sm);
  scrollbar-width: thin;
  scrollbar-color: var(--color-neon-primary) transparent;
  -webkit-overflow-scrolling: touch;
}

.projects__item {
  display: flex;
  /* The card's width lives here, on the direct flex child of the scroll
     track (.projects__track), not on .project-card itself: a nested flex
     item's own flex-basis does not reliably drive its non-flex ancestor's
     size, so the actual scrollable/non-shrinking box must own it directly. */
  flex: 0 0 clamp(260px, 80vw, 340px);
  scroll-snap-align: start;
}

@media (min-width: 640px) {
  .projects__item {
    flex-basis: 380px;
  }
}

.projects__scroll-hint {
  margin-top: var(--space-sm);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--color-text-dim);
}

@media (min-width: 900px) {
  .projects__scroll-hint {
    display: none;
  }
}
</style>
