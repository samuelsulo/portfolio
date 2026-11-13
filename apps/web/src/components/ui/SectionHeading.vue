<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="section-heading">
    <span class="section-heading__eyebrow">{{ eyebrow }}</span>
    <h2 class="section-heading__title">{{ title }}</h2>
    <p v-if="subtitle" class="section-heading__subtitle">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  max-width: 640px;
  margin-bottom: var(--space-xl);
}

.section-heading__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-neon-primary);
}

.section-heading__eyebrow::before {
  content: '';
  width: 26px;
  height: 2px;
  background-color: var(--color-neon-primary);
}

.section-heading__title {
  font-size: var(--fs-h2);
}

.section-heading__subtitle {
  color: var(--color-text-muted);
  font-size: var(--fs-body);
}
</style>
