<script setup lang="ts">
/**
 * Renders one legal document (Cookie Policy or Privacy Policy) as a
 * dismissible dialog. Both policies are surfaced as a modal rather than as routed
 * pages, so they open from any page, from the footer's legal links (see AppFooter.vue). The dialog shell
 * itself (overlay, focus management, Escape/scroll lock) lives in the
 * shared AppModal component; this component only supplies the title and
 * the translated legal text.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/ui/AppModal.vue'
import { getContent } from '@/content'
import type { SiteLegalConfig } from '@/types/content'

defineProps<{
  open: boolean
  documentKey: 'cookiePolicy' | 'privacyPolicy'
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const legal: SiteLegalConfig = getContent().siteConfig.legal

// Non-translatable data referenced by legal.privacyPolicy.content (see
// SiteLegalConfig), interpolated as named params, harmlessly ignored by
// legal.cookiePolicy.content, which doesn't reference any of them.
// contactFormRetentionMonths is a plain number, not a translated sentence
// (see SiteLegalConfig), so the actual "retained for N months" wording is
// resolved here, per locale, from the two dedicated messages below rather
// than baked into the number itself.
const legalParams = computed(() => ({
  ...legal,
  retentionPeriodParagraph:
    legal.contactFormRetentionMonths > 0
      ? t('legal.privacyPolicy.retentionPeriodKnown', { months: legal.contactFormRetentionMonths })
      : t('legal.privacyPolicy.retentionPeriodNone'),
}))

function close() {
  emit('close')
}
</script>

<template>
  <AppModal :open="open" @close="close">
    <template #title>{{ t(`legal.${documentKey}.title`) }}</template>
    <!-- eslint-disable-next-line vue/no-v-html -- content comes from our own
         translation files (legal.*.content), not from user input. -->
    <div class="legal-modal__body" v-html="t(`legal.${documentKey}.content`, legalParams)" />
  </AppModal>
</template>

<style scoped>
.legal-modal__body {
  overflow-y: auto;
  color: var(--color-text-muted);
  font-size: var(--fs-small);
  line-height: var(--lh-body);
}

.legal-modal__body :deep(p) {
  margin: 0 0 var(--space-sm);
}

.legal-modal__body :deep(p:last-child) {
  margin-bottom: 0;
}

.legal-modal__body :deep(h3) {
  margin: var(--space-md) 0 var(--space-2xs);
  color: var(--color-text);
  font-size: var(--fs-body);
}

.legal-modal__body :deep(ul) {
  margin: 0 0 var(--space-sm);
  padding-left: var(--space-md);
  list-style: disc;
}
</style>
