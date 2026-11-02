<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import WorkViewer from '@/components/work/WorkViewer.vue'
import FactsList from '@/components/work/FactsList.vue'
import projectsData from '@/data/projects.json'
import casesData from '@/data/cases.json'
import type { CaseData, ProjectItem } from '@/types/content'

const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.id))
const project = computed(() => (projectsData as ProjectItem[]).find((item) => item.id === id.value))
const work = computed(() => (casesData as unknown as Record<string, CaseData>)[id.value])

const meta = computed(() =>
  work.value
    ? work.value.meta.map((key) => ({
        id: key,
        label: t(`cases.items.${id.value}.meta.${key}.label`),
        value: t(`cases.items.${id.value}.meta.${key}.value`),
      }))
    : [],
)
</script>

<template>
  <article v-if="project && work" class="work container">
    <RouterLink :to="{ name: 'home', hash: '#projects' }" class="work__back">
      <AppIcon name="arrow-left" :size="16" />
      {{ t('cases.back') }}
    </RouterLink>

    <header class="work__head">
      <div>
        <p class="work__eyebrow" :class="`work__eyebrow--${project.kind}`">
          {{ t(`projects.kind.${project.kind}`) }}
        </p>
        <h1 class="work__title">{{ t(`${project.translationKey}.title`) }}</h1>
        <p class="work__lead">{{ t(`cases.items.${id}.lead`) }}</p>
      </div>
      <FactsList :facts="meta" />
    </header>

    <WorkViewer :key="id" :case-id="id" :materials="work.materials" />
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

.work__head {
  display: grid;
  gap: var(--space-lg);
  align-items: end;
}

@media (min-width: 900px) {
  .work__head {
    grid-template-columns: 1.2fr 1fr;
    gap: var(--space-2xl);
  }
}

.work__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.work__eyebrow::before {
  content: '';
  width: 26px;
  height: 2px;
  background-color: currentColor;
}

.work__eyebrow--client {
  color: var(--color-neon-success);
}

.work__eyebrow--demo {
  color: var(--color-neon-secondary);
}

.work__title {
  margin-block: var(--space-xs);
  font-size: var(--fs-h1);
  line-height: var(--lh-heading);
}

.work__lead {
  max-width: 60ch;
  color: var(--color-text-muted);
}

.work--missing {
  justify-items: start;
  min-height: 50vh;
  align-content: center;
}
</style>
