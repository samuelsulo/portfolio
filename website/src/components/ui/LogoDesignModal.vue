<script setup lang="ts">
/**
 * Previews the Kitsune brand mark's design-reference PDF (see docs/logo/)
 * in-page, via the shared AppModal shell, instead of sending visitors
 * straight to a downloaded file. The PDF itself is a static asset
 * (public/brand/kitsune-logo-design.pdf), copied verbatim from
 * docs/logo/logo-design.pdf by that folder's own regeneration pipeline
 * (docs/logo/source/generate-pdf.js), so this component never duplicates
 * or re-renders the document, only displays it.
 */
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

// Root-relative, matching how every other public/ asset is referenced in
// this codebase (see e.g. src/data/projects.json, HeroSection.vue).
const PDF_URL = '/brand/kitsune-logo-design.pdf'

function close() {
  emit('close')
}
</script>

<template>
  <AppModal :open="open" max-width="960px" max-height="92vh" @close="close">
    <template #title>{{ t('footer.logoDesignModalTitle') }}</template>
    <template #header-actions>
      <a
        :href="PDF_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="logo-design-modal__open-new-tab"
        :aria-label="t('footer.logoDesignOpenNewTabAriaLabel')"
      >
        <AppIcon name="external-link" :size="18" />
      </a>
    </template>
    <div class="logo-design-modal__body">
      <iframe :src="PDF_URL" :title="t('footer.logoDesignModalTitle')" class="logo-design-modal__frame" />
      <p class="logo-design-modal__caption">
        {{ t('footer.logoDesignCaption') }}
      </p>
    </div>
  </AppModal>
</template>

<style scoped>
.logo-design-modal__open-new-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.logo-design-modal__open-new-tab:hover {
  color: var(--color-neon-primary);
  border-color: var(--color-neon-primary);
}

.logo-design-modal__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.logo-design-modal__frame {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.logo-design-modal__caption {
  font-size: var(--fs-small);
  color: var(--color-text-dim);
  text-align: center;
}
</style>
