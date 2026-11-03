<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { assetUrl } from '@/content'
import { CV_PAGES } from '@/utils/cv'

/**
 * The CV as the pages of its PDF (images, so they look the same on every device,
 * phones included) with a link to the PDF itself.
 */
const props = defineProps<{ language: string; pdfUrl: string }>()

const { t } = useI18n()
const pages = Array.from({ length: CV_PAGES }, (_, index) => index + 1)
const pageSrc = (page: number) => assetUrl(`/images/cv/samuelsulo-cv-${props.language}-${page}.jpg`)
</script>

<template>
  <div class="cv-viewer">
    <a class="cv-viewer__download" :href="pdfUrl" target="_blank" rel="noopener noreferrer">
      {{ t('explore.download') }}
      <AppIcon name="external-link" :size="16" />
    </a>
    <img
      v-for="page in pages"
      :key="page"
      class="cv-viewer__page"
      :src="pageSrc(page)"
      :alt="t('explore.cv.pageAlt', { n: page })"
      loading="lazy"
    />
  </div>
</template>

<style scoped>
.cv-viewer {
  display: grid;
  justify-items: center;
  gap: var(--space-md);
}

.cv-viewer__download {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-md);
  color: var(--color-neon-primary);
  font-weight: 600;
}

.cv-viewer__download:hover {
  background-color: var(--color-neon-primary);
  color: var(--color-on-neon);
}

.cv-viewer__page {
  width: 100%;
  max-width: 794px;
  height: auto;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: #fff;
}
</style>
