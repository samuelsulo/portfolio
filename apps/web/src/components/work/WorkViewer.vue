<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import ArchitectureDiagram from '@/components/work/ArchitectureDiagram.vue'
import CardsBlock from '@/components/work/CardsBlock.vue'
import DesignBlock from '@/components/work/DesignBlock.vue'
import DevicesBlock from '@/components/work/DevicesBlock.vue'
import FactsList from '@/components/work/FactsList.vue'
import ImagesBlock from '@/components/work/ImagesBlock.vue'
import { assetUrl } from '@/content'
import type { CaseMaterial } from '@/types/content'

const props = defineProps<{ caseId: string; materials: CaseMaterial[] }>()

const { t } = useI18n()

const selectedId = ref(props.materials[0]?.id ?? '')
const selected = computed(
  () => props.materials.find((material) => material.id === selectedId.value) ?? props.materials[0],
)

const tabRefs = ref<HTMLElement[]>([])

// On narrow screens the tabs scroll sideways: keep the selected one in view.
watch(selectedId, async () => {
  await nextTick()
  const index = props.materials.findIndex((material) => material.id === selectedId.value)
  tabRefs.value[index]?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
})

function key(material: CaseMaterial, path: string): string {
  return `cases.items.${props.caseId}.materials.${material.id}.${path}`
}

function image(source: { src: string; alt: string }) {
  return { src: assetUrl(source.src), alt: t(source.alt) }
}

const facts = computed(() =>
  selected.value
    ? selected.value.facts.map((fact) => ({
        id: fact,
        label: t(key(selected.value, `facts.${fact}.label`)),
        value: t(key(selected.value, `facts.${fact}.value`)),
      }))
    : [],
)

function onKeydown(event: KeyboardEvent, index: number) {
  const step =
    event.key === 'ArrowDown' || event.key === 'ArrowRight'
      ? 1
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        ? -1
        : 0
  if (!step) return
  event.preventDefault()
  const next = (index + step + props.materials.length) % props.materials.length
  selectedId.value = props.materials[next].id
  tabRefs.value[next]?.focus()
}
</script>

<template>
  <div class="viewer">
    <div
      class="viewer__tabs"
      role="tablist"
      :aria-label="t('cases.viewerLabel')"
      aria-orientation="vertical"
    >
      <button
        v-for="(material, index) in materials"
        :id="`tab-${material.id}`"
        :key="material.id"
        :ref="(el) => (tabRefs[index] = el as HTMLElement)"
        type="button"
        role="tab"
        class="viewer__tab"
        :aria-selected="material.id === selectedId"
        aria-controls="work-panel"
        :tabindex="material.id === selectedId ? 0 : -1"
        @click="selectedId = material.id"
        @keydown="onKeydown($event, index)"
      >
        <AppIcon :name="material.icon" :size="20" />
        <span>
          <small>{{ t(`cases.groups.${material.group}`) }}</small>
          {{ t(`cases.tabs.${material.id}`) }}
        </span>
      </button>
    </div>

    <div
      v-if="selected"
      id="work-panel"
      class="viewer__panel"
      role="tabpanel"
      :aria-labelledby="`tab-${selected.id}`"
      tabindex="0"
    >
      <ImagesBlock
        v-if="selected.type === 'images'"
        :images="selected.images.map((source) => image(source))"
        :tone="selected.tone"
      />
      <DevicesBlock
        v-else-if="selected.type === 'devices'"
        :desktop="image(selected.desktop)"
        :tablet="image(selected.tablet)"
        :phone="image(selected.phone)"
        :url="selected.url"
      />
      <DesignBlock
        v-else-if="selected.type === 'design'"
        :swatches="selected.swatches"
        :fonts="selected.fonts"
      />
      <ArchitectureDiagram v-else-if="selected.type === 'diagram'" :owner="selected.owner" />
      <CardsBlock
        v-else-if="selected.type === 'cards'"
        :cards="
          selected.cards.map((card) => ({
            id: card.id,
            icon: card.icon,
            title: t(key(selected, `cards.${card.id}.title`)),
            text: t(key(selected, `cards.${card.id}.text`)),
            image: card.image ? image(card.image) : null,
          }))
        "
      />

      <FactsList :facts="facts" />

      <a
        v-if="selected.document"
        class="viewer__document"
        :href="assetUrl(selected.document.src)"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t(selected.document.label) }}
        <AppIcon name="external-link" :size="16" />
      </a>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

@media (min-width: 900px) {
  .viewer {
    grid-template-columns: 250px minmax(0, 1fr);
  }
}

.viewer__tabs {
  display: flex;
  overflow-x: auto;
  /* Fade the right edge so it is clear that the tabs scroll. */
  mask-image: linear-gradient(90deg, #000 88%, transparent);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

@media (min-width: 900px) {
  .viewer__tabs {
    flex-direction: column;
    overflow: visible;
    mask-image: none;
    border-right: 1px solid var(--color-border);
    border-bottom: 0;
  }
}

.viewer__tab {
  display: grid;
  grid-template-columns: 22px auto;
  align-items: center;
  gap: var(--space-xs);
  min-width: max-content;
  padding: var(--space-sm) var(--space-md);
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--color-text-muted);
  font-size: var(--fs-small);
  text-align: left;
  cursor: pointer;
}

.viewer__tab small {
  display: block;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.viewer__tab:hover {
  color: var(--color-text);
}

.viewer__tab[aria-selected='true'] {
  background-color: var(--color-surface);
  border-bottom-color: var(--color-neon-primary);
  color: var(--color-text);
}

.viewer__tab[aria-selected='true'] svg {
  color: var(--color-neon-primary);
}

@media (min-width: 900px) {
  .viewer__tab {
    border-bottom: 0;
    border-left: 2px solid transparent;
  }

  .viewer__tab + .viewer__tab {
    border-top: 1px solid var(--color-border);
  }

  .viewer__tab[aria-selected='true'] {
    border-left-color: var(--color-neon-primary);
  }
}

.viewer__document {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  width: fit-content;
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.viewer__document:hover {
  border-color: var(--color-neon-primary);
}

.viewer__panel {
  display: grid;
  align-content: start;
  gap: var(--space-md);
  min-width: 0;
  padding: var(--space-lg);
}

@media (max-width: 640px) {
  .viewer__panel {
    padding: var(--space-md);
  }
}
</style>
