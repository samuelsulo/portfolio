<script setup lang="ts">
defineProps<{ facts: { id: string; label: string; value: string }[] }>()
</script>

<template>
  <dl v-if="facts.length" class="facts">
    <div v-for="fact in facts" :key="fact.id" class="facts__item">
      <dt>{{ fact.label }}</dt>
      <dd>{{ fact.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: var(--space-sm) var(--space-lg);
  margin: 0;
}

.facts dt {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.facts dd {
  margin: var(--space-3xs) 0 0;
  font-size: var(--fs-small);
}
</style>
