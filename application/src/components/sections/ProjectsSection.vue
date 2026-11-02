<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ProjectCard from '@/components/ui/ProjectCard.vue'
import projectsData from '@/data/projects.json'
import type { ProjectItem } from '@/types/content'
import { WORK_FILTERS, filterWorks, type WorkFilter } from '@/utils/works'

const { t } = useI18n()
const projects = projectsData as ProjectItem[]

const filter = ref<WorkFilter>('all')

const items = computed(() =>
  filterWorks(projects, filter.value).map((project) => ({
    ...project,
    title: t(`${project.translationKey}.title`),
    description: t(`${project.translationKey}.description`),
    imageAlt: t(project.imageAlt),
    kindLabel: t(`projects.kind.${project.kind}`),
    materialLabels: project.materials.map((material) => t(`projects.materials.${material}`)),
  })),
)
</script>

<template>
  <section id="projects" v-reveal class="projects">
    <div class="container">
      <SectionHeading
        :eyebrow="t('projects.eyebrow')"
        :title="t('projects.title')"
        :subtitle="t('projects.subtitle')"
      />

      <div class="projects__filters" role="group" :aria-label="t('projects.filterLabel')">
        <button
          v-for="option in WORK_FILTERS"
          :key="option"
          type="button"
          class="projects__filter"
          :class="{ 'is-active': filter === option }"
          :aria-pressed="filter === option"
          @click="filter = option"
        >
          {{ t(`projects.filters.${option}`) }}
        </button>
      </div>

      <div class="projects__grid">
        <ProjectCard
          v-for="item in items"
          :key="item.id"
          :image="item.image"
          :image-alt="item.imageAlt"
          :title="item.title"
          :description="item.description"
          :kind="item.kind"
          :kind-label="item.kindLabel"
          :materials="item.materialLabels"
          :materials-label="t('projects.materialsLabel')"
          :to="{ name: 'work', params: { id: item.id } }"
          :url="item.url"
          :cta-label="t('projects.viewProject')"
          :open-case-label="t('projects.openCase')"
          :lead="item.kind === 'client'"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects {
  padding-block: var(--space-2xl);
  border-top: 1px solid var(--color-border);
}

.projects__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin-bottom: var(--space-md);
}

.projects__filter {
  padding: var(--space-3xs) var(--space-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.06em;
  cursor: pointer;
}

.projects__filter:hover {
  color: var(--color-text);
}

.projects__filter.is-active {
  border-color: var(--color-neon-primary);
  background-color: var(--color-neon-primary);
  color: var(--color-on-neon);
}

.projects__grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 700px) {
  .projects__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .projects__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
