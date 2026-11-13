<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import WorkViewer from '@/components/work/WorkViewer.vue'
import FactsList from '@/components/work/FactsList.vue'
import { getContent, loadCase } from '@/content'
import type { CaseData } from '@/types/content'

/**
 * A work in full: what it is, its facts and the tabbed viewer of its materials.
 * Shared by the work page and by the sheet of the 3D view, which has its own title.
 */
const props = withDefaults(defineProps<{ id: string; showTitle?: boolean }>(), { showTitle: true })

const { t } = useI18n()

const project = computed(() => getContent().projects.find((item) => item.id === props.id))

// The materials of a work are fetched when it is opened (or earlier, if the visitor showed interest in it).
const work = ref<CaseData | null>(null)
const hasFailed = ref(false)
watch(
  () => props.id,
  async (id) => {
    work.value = null
    hasFailed.value = false
    try {
      const data = await loadCase(id)
      if (props.id === id) work.value = data
    } catch (error) {
      console.error(error)
      if (props.id === id) hasFailed.value = true
    }
  },
  { immediate: true },
)

const meta = computed(() =>
  work.value
    ? work.value.meta.map((key) => ({
        id: key,
        label: t(`cases.items.${props.id}.meta.${key}.label`),
        value: t(`cases.items.${props.id}.meta.${key}.value`),
      }))
    : [],
)
</script>

<template>
  <div v-if="project && work" class="work-detail">
    <header class="work-detail__head" :class="{ 'work-detail__head--start': !showTitle }">
      <div>
        <p class="work-detail__eyebrow" :class="`work-detail__eyebrow--${project.kind}`">
          {{ t(`projects.kind.${project.kind}`) }}
        </p>
        <h1 v-if="showTitle" class="work-detail__title">
          {{ t(`${project.translationKey}.title`) }}
        </h1>
        <p class="work-detail__lead">{{ t(`cases.items.${id}.lead`) }}</p>
      </div>
      <FactsList :facts="meta" />
    </header>

    <WorkViewer :key="id" :case-id="id" :materials="work.materials" />
  </div>
  <p v-else-if="hasFailed" class="work-detail__status" role="alert">{{ t('cases.loadError') }}</p>
  <p v-else class="work-detail__status" role="status">{{ t('cases.loading') }}</p>
</template>

<style scoped>
.work-detail {
  display: grid;
  gap: var(--space-lg);
}

.work-detail__head {
  display: grid;
  gap: var(--space-lg);
  align-items: end;
}

@media (min-width: 900px) {
  .work-detail__head--start {
    align-items: start;
  }

  .work-detail__head {
    grid-template-columns: 1.2fr 1fr;
    gap: var(--space-2xl);
  }
}

.work-detail__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.work-detail__eyebrow::before {
  content: '';
  width: 26px;
  height: 2px;
  background-color: currentColor;
}

.work-detail__eyebrow--client {
  color: var(--color-neon-success);
}

.work-detail__eyebrow--demo {
  color: var(--color-neon-secondary);
}

.work-detail__title {
  margin-block: var(--space-xs);
  font-size: var(--fs-h1);
  line-height: var(--lh-heading);
}

.work-detail__status {
  min-height: 40vh;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.work-detail__lead {
  max-width: 60ch;
  color: var(--color-text-muted);
}
</style>
