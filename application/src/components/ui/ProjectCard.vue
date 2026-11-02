<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps<{
  image: string
  imageAlt: string
  title: string
  description: string
  kind: 'client' | 'demo'
  kindLabel: string
  materials: string[]
  materialsLabel: string
  /** The work's own page. */
  to: RouteLocationRaw
  /** The live site, if any. */
  url: string | null
  ctaLabel: string
  openCaseLabel: string
  /** Wide horizontal layout, used for real client work. */
  lead?: boolean
}>()
</script>

<template>
  <article class="project-card" :class="{ 'project-card--lead': lead }">
    <div class="project-card__media">
      <img :src="image" :alt="imageAlt" loading="lazy" />
    </div>
    <div class="project-card__body">
      <span class="project-card__tag" :class="`project-card__tag--${kind}`">{{ kindLabel }}</span>
      <h3 class="project-card__title">{{ title }}</h3>
      <p class="project-card__description">{{ description }}</p>
      <ul v-if="materials.length" class="project-card__materials" :aria-label="materialsLabel">
        <li v-for="material in materials" :key="material">{{ material }}</li>
      </ul>
      <div class="project-card__actions">
        <a
          v-if="url"
          :href="url"
          class="project-card__cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ ctaLabel }}
          <AppIcon name="external-link" :size="16" />
        </a>
        <!-- Stretched link: the whole card opens the work, this button makes that visible. -->
        <RouterLink :to="to" class="project-card__open">
          {{ openCaseLabel }}
          <AppIcon name="arrow-right" :size="16" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.project-card:hover {
  border-color: var(--color-neon-primary);
  transform: translateY(-2px);
}

.project-card__media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.project-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card__body {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
  padding: var(--space-md);
}

.project-card__tag {
  align-self: flex-start;
  padding: 2px var(--space-xs);
  border: 1px solid;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.project-card__tag--client {
  border-color: rgba(var(--color-neon-success-rgb), 0.6);
  background-color: rgba(var(--color-neon-success-rgb), 0.1);
  color: var(--color-neon-success);
}

.project-card__tag--demo {
  border-color: rgba(var(--color-neon-secondary-rgb), 0.55);
  background-color: rgba(var(--color-neon-secondary-rgb), 0.09);
  color: var(--color-neon-secondary);
}

.project-card__title {
  font-size: var(--fs-h3);
}

.project-card__description {
  color: var(--color-text-muted);
  font-size: var(--fs-small);
}

.project-card__materials {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: auto 0 0;
  padding: var(--space-2xs) 0 0;
  list-style: none;
}

.project-card__materials li {
  padding: 2px var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-surface-alt);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}

.project-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  margin-top: var(--space-2xs);
}

.project-card__open {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-left: auto;
  padding: var(--space-2xs) var(--space-sm);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-sm);
  background-color: var(--color-neon-primary);
  color: var(--color-on-neon);
  font-size: var(--fs-small);
  font-weight: 600;
}

.project-card__open::after {
  content: '';
  position: absolute;
  inset: 0;
}

.project-card__open:hover {
  box-shadow: var(--glow-primary-strong);
}

.project-card__cta {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-neon-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.project-card__cta:hover {
  text-decoration: underline;
}

@media (min-width: 900px) {
  .project-card--lead {
    grid-column: 1 / -1;
    flex-direction: row;
  }

  .project-card--lead .project-card__media {
    flex: 1.15 1 0;
    aspect-ratio: auto;
    min-height: 280px;
    border-right: 1px solid var(--color-border);
    border-bottom: 0;
  }

  .project-card--lead .project-card__body {
    justify-content: center;
    padding: var(--space-lg);
  }

  .project-card--lead .project-card__title {
    font-size: var(--fs-h2);
  }

  .project-card--lead .project-card__description {
    font-size: var(--fs-body);
  }
}
</style>
