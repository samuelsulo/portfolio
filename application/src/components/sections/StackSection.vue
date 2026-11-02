<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import stackData from '@/data/stack.json'
import type { StackGroup } from '@/types/content'

const { t } = useI18n()
const groups = stackData as StackGroup[]
</script>

<template>
  <section id="stack" v-reveal class="stack">
    <div class="container">
      <SectionHeading :eyebrow="t('stack.eyebrow')" :title="t('stack.title')" />

      <div class="stack__grid">
        <article v-for="group in groups" :key="group.id" class="stack__group">
          <h3 class="stack__title">
            {{ t(`${group.translationKey}.title`) }}
            <span>{{ t(`${group.translationKey}.tag`) }}</span>
          </h3>
          <ul class="stack__items">
            <li v-for="item in group.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stack {
  padding-block: var(--space-2xl);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.stack__grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 900px) {
  .stack__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.stack__group {
  padding: var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-top: 3px solid var(--color-neon-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.stack__group:nth-child(2) {
  border-top-color: var(--color-neon-secondary);
}

.stack__group:nth-child(3) {
  border-top-color: var(--color-neon-success);
}

.stack__title {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
  font-size: var(--fs-body);
  font-weight: 600;
}

.stack__title span {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stack__items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.stack__items li {
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}
</style>
