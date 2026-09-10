<script setup lang="ts">
/**
 * Generic dismissible dialog shell: overlay, glass-surface card, header
 * (title + optional extra actions + close button), focus management
 * (focuses the close button on open, restores the previously focused
 * element on close), Escape-to-close, click-outside-to-close, and page
 * scroll lock while open. Owns none of the body content: callers supply
 * the title via the `title` slot and the body via the default slot, so the
 * same shell serves both the legal policy text (LegalPolicyView) and the
 * logo design PDF preview (LogoDesignModal).
 */
import { nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** CSS max-width of the dialog card. */
    maxWidth?: string
    /** CSS max-height of the dialog card. */
    maxHeight?: string
    /**
     * Make the card always take `maxHeight` instead of hugging its content.
     * The legal policy text naturally grows tall enough to reach maxHeight
     * on its own (and looks fine hugging shorter content too), but a body
     * with no intrinsic height of its own (an iframe) needs an ancestor
     * with a *definite* height for its own `flex: 1` to have anything to
     * fill; without this, it collapses to its default ~150px.
     */
    fillHeight?: boolean
  }>(),
  {
    maxWidth: '640px',
    maxHeight: 'min(85vh, 720px)',
    fillHeight: false,
  },
)

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const titleId = `app-modal-title-${useId()}`

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
  <Transition name="app-modal">
    <div v-if="open" class="app-modal__overlay" @click.self="close" @keydown="handleKeydown">
      <div
        class="app-modal glass-surface"
        :class="{ 'app-modal--fill-height': fillHeight }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :style="{ '--app-modal-max-width': maxWidth, '--app-modal-max-height': maxHeight }"
      >
        <div class="app-modal__header">
          <h2 :id="titleId" class="app-modal__title">
            <slot name="title" />
          </h2>
          <div class="app-modal__header-actions">
            <slot name="header-actions" />
            <button
              ref="closeButtonRef"
              type="button"
              class="app-modal__close"
              :aria-label="t('common.close')"
              @click="close"
            >
              <AppIcon name="close" :size="20" />
            </button>
          </div>
        </div>
        <div class="app-modal__body">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background-color: rgba(5, 6, 10, 0.72);
}

.app-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
  max-width: var(--app-modal-max-width);
  max-height: var(--app-modal-max-height);
  padding: var(--space-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.app-modal--fill-height {
  height: var(--app-modal-max-height);
}

.app-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
}

.app-modal__title {
  font-size: var(--fs-h3);
}

.app-modal__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  flex-shrink: 0;
}

.app-modal__close {
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

.app-modal__close:hover {
  color: var(--color-neon-primary);
  border-color: var(--color-neon-primary);
}

.app-modal__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;
}
</style>
