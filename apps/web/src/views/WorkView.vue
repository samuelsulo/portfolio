<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import WorkDetail from '@/components/work/WorkDetail.vue'
import { getContent } from '@/content'

const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.id))
const exists = computed(() => getContent().projects.some((item) => item.id === id.value))
</script>

<template>
  <article v-if="exists" class="work container">
    <RouterLink :to="{ name: 'home', hash: '#projects' }" class="work__back">
      <AppIcon name="arrow-left" :size="16" />
      {{ t('cases.back') }}
    </RouterLink>

    <WorkDetail :id="id" />
  </article>

  <section v-else class="work work--missing container">
    <h1>{{ t('cases.notFoundTitle') }}</h1>
    <p>{{ t('cases.notFoundBody') }}</p>
    <RouterLink :to="{ name: 'home', hash: '#projects' }" class="work__back">
      <AppIcon name="arrow-left" :size="16" />
      {{ t('cases.back') }}
    </RouterLink>
  </section>
</template>

<style scoped>
.work {
  display: grid;
  gap: var(--space-lg);
  padding-block: var(--space-lg) var(--space-2xl);
}

.work__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  width: fit-content;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.work__back:hover {
  color: var(--color-neon-primary);
}

.work--missing {
  justify-items: start;
  min-height: 50vh;
  align-content: center;
}
</style>
