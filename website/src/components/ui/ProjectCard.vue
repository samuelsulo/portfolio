<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'

defineProps<{
  image: string
  imageAlt: string
  title: string
  description: string
  technologies: string[]
  url: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <article class="project-card">
    <div class="project-card__media">
      <img :src="image" :alt="imageAlt" loading="lazy" />
    </div>
    <div class="project-card__body">
      <h3 class="project-card__title">{{ title }}</h3>
      <p class="project-card__description">{{ description }}</p>
      <ul v-if="technologies.length" class="project-card__tech" :aria-label="technologies.join(', ')">
        <li v-for="tech in technologies" :key="tech" class="project-card__badge">{{ tech }}</li>
      </ul>
      <a
        v-if="url"
        :href="url"
        class="project-card__cta"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('projects.viewProject') }}
        <AppIcon name="external-link" :size="16" />
      </a>
      <span v-else class="project-card__cta project-card__cta--muted">
        {{ t('projects.comingSoon') }}
      </span>
    </div>
  </article>
</template>

<style scoped>
.project-card {
  display: flex;
  flex-direction: column;
  /* Width comes from .projects__item (the direct, non-shrinking flex child
     of the scroll track): this just fills whatever box that wrapper gives
     it, so there is a single source of truth for the card width. */
  flex: 1 1 auto;
  width: 100%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.project-card:hover {
  border-color: rgba(var(--color-neon-secondary-rgb), 0.5);
  box-shadow: var(--glow-secondary);
  transform: translateY(-4px);
}

.project-card__media {
  aspect-ratio: 16 / 10;
  background-color: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
}

.project-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card__body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: var(--space-md);
  gap: var(--space-2xs);
}

.project-card__title {
  font-size: var(--fs-h3);
}

.project-card__description {
  color: var(--color-text-muted);
  flex-grow: 1;
}

.project-card__tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: var(--space-xs) 0;
}

.project-card__badge {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  padding: var(--space-3xs) var(--space-xs);
  color: var(--color-text-muted);
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

.project-card__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  color: var(--color-neon-secondary);
  font-weight: 600;
  align-self: flex-start;
  transition: filter var(--duration-fast) var(--ease-out);
}

.project-card__cta:hover {
  filter: brightness(1.2);
}

.project-card__cta--muted {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

@media (prefers-reduced-motion: reduce) {
  .project-card:hover {
    transform: none;
  }
}
</style>
