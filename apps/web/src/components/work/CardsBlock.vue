<script setup lang="ts">
import AppIcon, { type IconName } from '@/components/ui/AppIcon.vue'

defineProps<{
  cards: {
    id: string
    icon: IconName
    title: string
    text: string
    image: { src: string; alt: string } | null
  }[]
}>()
</script>

<template>
  <div class="cards">
    <article v-for="card in cards" :key="card.id" class="cards__item">
      <div class="cards__thumb">
        <img v-if="card.image" :src="card.image.src" :alt="card.image.alt" loading="lazy" />
        <AppIcon v-else :name="card.icon" :size="40" class="cards__icon" />
      </div>
      <h3>{{ card.title }}</h3>
      <p>{{ card.text }}</p>
    </article>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: var(--space-sm);
}

.cards__item {
  display: grid;
  grid-template-rows: auto auto 1fr;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
}

.cards__thumb {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.cards__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cards__icon {
  color: var(--color-neon-primary);
}

.cards__item h3 {
  padding: var(--space-sm) var(--space-md) 0;
  font-size: var(--fs-body);
}

.cards__item p {
  padding: var(--space-2xs) var(--space-md) var(--space-md);
  color: var(--color-text-muted);
  font-size: var(--fs-small);
  line-height: 1.55;
}
</style>
