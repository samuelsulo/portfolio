<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SwatchId } from '@/types/content'

defineProps<{
  swatches: { id: SwatchId; color: string }[]
  fonts: { role: 'headings' | 'body' | 'data'; family: string }[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="design">
    <ul class="design__swatches" :aria-label="t('cases.swatchesLabel')">
      <li v-for="swatch in swatches" :key="swatch.id" class="design__swatch">
        <i :style="{ backgroundColor: swatch.color }" />
        <span>
          <b>{{ t(`cases.swatch.${swatch.id}`) }}</b>
          {{ swatch.color }}
        </span>
      </li>
    </ul>
    <ul class="design__fonts" :aria-label="t('cases.fontsLabel')">
      <li v-for="font in fonts" :key="font.role">
        <small>{{ t(`cases.typeRole.${font.role}`) }}</small>
        <strong>{{ font.family }}</strong>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.design {
  display: grid;
  gap: var(--space-md);
}

.design__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.design__swatch {
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
}

.design__swatch i {
  display: block;
  height: 64px;
  border-bottom: 1px solid var(--color-border);
}

.design__swatch span {
  display: block;
  padding: var(--space-2xs) var(--space-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.5;
}

.design__swatch b {
  display: block;
  color: var(--color-text);
  font-weight: 500;
}

.design__fonts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.design__fonts li {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
}

.design__fonts small {
  display: block;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.design__fonts strong {
  font-size: var(--fs-h3);
  font-weight: 600;
}
</style>
