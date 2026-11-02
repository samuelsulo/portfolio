<script setup lang="ts">
defineProps<{
  images: { src: string; alt: string }[]
  /** A warm paper background, for artwork designed on a light ground (logos). */
  warm?: boolean
}>()
</script>

<template>
  <div class="images" :class="{ 'images--duo': images.length > 1, 'images--warm': warm }">
    <img
      v-for="image in images"
      :key="image.src"
      :src="image.src"
      :alt="image.alt"
      loading="lazy"
    />
  </div>
</template>

<style scoped>
.images {
  display: grid;
  place-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-alt);
  overflow: hidden;
}

.images--warm {
  background-color: #fdfaf2;
}

.images--duo {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 640px) {
  .images--duo {
    grid-template-columns: minmax(0, 1fr);
  }
}

.images img {
  width: auto;
  max-width: 100%;
  max-height: 520px;
  border-radius: 4px;
}
</style>
