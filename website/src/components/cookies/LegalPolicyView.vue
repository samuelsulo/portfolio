<script setup lang="ts">
/**
 * Renders one legal document (Cookie Policy or Privacy Policy) as a
 * dismissible dialog. The site has no router (single-page portfolio), so
 * both policies are surfaced as a modal rather than as routed pages, opened
 * from the footer's legal links (see AppFooter.vue).
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import siteConfig from '@/data/site-config.json'
import type { SiteLegalConfig } from '@/types/content'

const props = defineProps<{
  open: boolean
  documentKey: 'cookiePolicy' | 'privacyPolicy'
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const legal: SiteLegalConfig = siteConfig.legal

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

const isOpen = ref(props.open)
watch(
  () => props.open,
  (value) => (isOpen.value = value),
)
useBodyScrollLock(isOpen)

const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      closeButtonRef.value?.focus()
    } else {
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)

function close() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}
</script>

<template>
  <Transition name="legal-modal">
    <div v-if="open" class="legal-modal__overlay" @click.self="close" @keydown="handleKeydown">
      <div
        class="legal-modal glass-surface"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`legal-modal-title-${documentKey}`"
      >
        <div class="legal-modal__header">
          <h2 :id="`legal-modal-title-${documentKey}`" class="legal-modal__title">
            {{ t(`legal.${documentKey}.title`) }}
          </h2>
          <button
            ref="closeButtonRef"
            type="button"
            class="legal-modal__close"
            :aria-label="t('legal.close')"
            @click="close"
          >
            <AppIcon name="close" :size="20" />
          </button>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -- content comes from our own
             translation files (legal.*.content), not from user input. -->
        <div class="legal-modal__body" v-html="t(`legal.${documentKey}.content`, legalParams)" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.legal-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background-color: rgba(5, 6, 10, 0.72);
}

.legal-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
  max-width: 640px;
  max-height: min(85vh, 720px);
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.legal-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.legal-modal__title {
  font-size: var(--fs-h3);
}

.legal-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.legal-modal__close:hover {
  color: var(--color-neon-primary);
  border-color: var(--color-neon-primary);
}

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

.legal-modal-enter-active,
.legal-modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.legal-modal-enter-from,
.legal-modal-leave-to {
  opacity: 0;
}
</style>
