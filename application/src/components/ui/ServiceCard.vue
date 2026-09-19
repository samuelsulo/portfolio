<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

defineProps<{
  icon: IconName
  title: string
  description: string
  technologies: string[]
}>()
</script>

<template>
  <article class="service-card">
    <div class="service-card__icon" aria-hidden="true">
      <AppIcon :name="icon" :size="28" />
    </div>
    <h3 class="service-card__title">{{ title }}</h3>
    <p class="service-card__description">{{ description }}</p>
    <ul v-if="technologies.length" class="service-card__tech" :aria-label="technologies.join(', ')">
      <li v-for="tech in technologies" :key="tech" class="service-card__badge">{{ tech }}</li>
    </ul>
  </article>
</template>

<style scoped>
.service-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.service-card:hover {
  border-color: rgba(var(--color-neon-primary-rgb), 0.5);
  box-shadow: var(--glow-primary);
  transform: translateY(-4px);
}

.service-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-neon-primary);
  background-color: rgba(var(--color-neon-primary-rgb), 0.08);
  border: 1px solid rgba(var(--color-neon-primary-rgb), 0.25);
}

.service-card__title {
  font-size: var(--fs-h3);
  margin-bottom: var(--space-2xs);
}

.service-card__description {
  color: var(--color-text-muted);
  flex-grow: 1;
}

.service-card__tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin-top: var(--space-md);
}

.service-card__badge {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  padding: var(--space-3xs) var(--space-xs);
  color: var(--color-text-muted);
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
}

@media (prefers-reduced-motion: reduce) {
  .service-card:hover {
    transform: none;
  }
}
</style>
